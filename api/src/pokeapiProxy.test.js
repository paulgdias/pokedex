import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The proxy is CommonJS and reads its config at load time, so it is loaded
// with `require` (fresh per test) after the env vars are set. It calls the
// global `fetch` at request time, so stubbing that stands in for PokeAPI and
// GitHub while the tests talk to a real Express app with the real fetch.
const require = createRequire(import.meta.url);
const PROXY_PATH = require.resolve("./pokeapiProxy.js");
const realFetch = globalThis.fetch;
const realSetTimeout = globalThis.setTimeout;

const DAY = 24 * 60 * 60 * 1000;
const GRAPHQL_URL = "https://beta.pokeapi.co/graphql/v1beta";
const ASSET_HOST = "https://raw.githubusercontent.com/PokeAPI/";
const SPRITE = "sprites/master/sprites/pokemon/1.png";

const POKEDEX = "query getPokedex { pokemon { id } }";
const INFO = "query getPokemonInfo($id: Int) { pokemon(id: $id) { id } }";
const EFFICACY = "query getTypeEfficacy { type { id } }";

let cacheDir;
let fetchMock;
let proxy;
let server;
let base;

const jsonResponse = (body, init) =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
        ...init,
    });

const tooMany = (retryAfter) =>
    new Response("", {
        status: 429,
        headers: retryAfter === undefined ? {} : { "retry-after": retryAfter },
    });

/** loads a fresh copy of the proxy (module state and env are read at load). */
const loadProxy = (env = {}) => {
    process.env.POKEAPI_CACHE_DIR = cacheDir;
    for (const [key, value] of Object.entries(env)) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }
    delete require.cache[PROXY_PATH];
    return require(PROXY_PATH);
};

const listen = async () => {
    const express = require("express");
    const app = express();
    app.use(express.json());
    app.use("/pokeapi", proxy.router);
    server = await new Promise((resolve) => {
        const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    base = `http://127.0.0.1:${server.address().port}`;
};

const post = (body, headers = { "content-type": "application/json" }) =>
    realFetch(`${base}/pokeapi/graphql`, {
        method: "POST",
        headers,
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

const getAsset = (assetPath) =>
    realFetch(`${base}/pokeapi/assets/${assetPath}`);

/** raw request: `fetch` would normalise `..` and `%2e%2e` out of the URL. */
const rawGet = (rawPath) =>
    new Promise((resolve, reject) => {
        const url = new URL(base);
        http.get(
            { host: url.hostname, port: url.port, path: rawPath },
            (res) => {
                res.resume();
                res.on("end", () => resolve(res.statusCode));
            }
        ).on("error", reject);
    });

const listFiles = async (dir) => {
    const entries = await fs
        .readdir(dir, { withFileTypes: true })
        .catch(() => []);
    const files = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listFiles(full)));
        } else {
            files.push(full);
        }
    }
    return files;
};

const graphqlFiles = () => listFiles(path.join(cacheDir, "graphql"));

const onlyGraphqlFile = async () => {
    const files = await graphqlFiles();
    expect(files).toHaveLength(1);
    return files[0];
};

/** writes a file into the cache, `ageMs` old. */
const seed = async (relative, content, ageMs = 0) => {
    const file = path.join(cacheDir, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
    const when = new Date(Date.now() - ageMs);
    await fs.utimes(file, when, when);
    return file;
};

const backdate = async (file, ageMs) => {
    const when = new Date(Date.now() - ageMs);
    await fs.utimes(file, when, when);
};

const mtime = async (file) => (await fs.stat(file)).mtimeMs;

/** the sleeps the proxy asked for, without actually waiting for them. */
const recordSleeps = () => {
    const sleeps = [];
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn, ms, ...args) => {
        if (ms >= 1000) {
            sleeps.push(ms);
            return realSetTimeout(fn, 0, ...args);
        }
        return realSetTimeout(fn, ms, ...args);
    });
    return sleeps;
};

const upstreamCalls = (url) =>
    fetchMock.mock.calls.filter(([target]) => target === url);

beforeEach(async () => {
    cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "pokeapi-proxy-"));
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    proxy = loadProxy({ POKEAPI_CACHE_MAX_AGE_DAYS: undefined });
    await listen();
});

afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.POKEAPI_CACHE_DIR;
    delete process.env.POKEAPI_CACHE_MAX_AGE_DAYS;
    await fs.rm(cacheDir, { recursive: true, force: true });
});

describe("POST /graphql: operation allowlist", () => {
    it.each([
        ["getPokedex", POKEDEX],
        ["getPokemonInfo", INFO],
        ["getTypeEfficacy", EFFICACY],
    ])("forwards %s", async (_name, query) => {
        fetchMock.mockImplementation(async () => jsonResponse({ data: {} }));

        const res = await post({ query });

        expect(res.status).toBe(200);
        expect(upstreamCalls(GRAPHQL_URL)).toHaveLength(1);
    });

    it("sends the query and variables upstream as JSON", async () => {
        fetchMock.mockImplementation(async () => jsonResponse({ data: {} }));

        await post({ query: INFO, variables: { id: 25 } });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(GRAPHQL_URL);
        expect(init.method).toBe("POST");
        expect(init.headers).toEqual({ "content-type": "application/json" });
        expect(JSON.parse(init.body)).toEqual({
            query: INFO,
            variables: { id: 25 },
        });
    });

    it.each([
        ["a mutation", "mutation getPokedex { x }"],
        ["a subscription", "subscription getPokedex { x }"],
        ["an anonymous query", "query { x }"],
        ["shorthand", "{ x }"],
        ["an unknown operation", "query somethingElse { x }"],
        [
            "a name that only starts with an allowed one",
            "query getPokedexEvil { x }",
        ],
        [
            "an allowed name in a comment",
            "# query getPokedex\nquery evil { x }",
        ],
        ["a non-string query", 123],
        ["an empty query", ""],
    ])("rejects %s", async (_name, query) => {
        const res = await post({ query });

        expect(res.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects a request without a body", async () => {
        const res = await post("", {});

        expect(res.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects a body that is not valid JSON", async () => {
        const res = await post("{not json", {
            "content-type": "application/json",
        });

        expect(res.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        ["a second query", "query getPokedex { a } query somethingElse { b }"],
        ["a trailing mutation", "query getPokedex { a } mutation m { b }"],
        ["a trailing shorthand query", "query getPokedex { a } { b }"],
    ])("rejects a document with %s", async (_name, query) => {
        const res = await post({ query });

        expect(res.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("accepts braces, keywords and fragments inside one operation", async () => {
        fetchMock.mockImplementation(async () => jsonResponse({ data: {} }));
        const query = `query getPokedex($where: pokemon_bool_exp = {name: {_eq: "query x { y }"}}) {
            pokemon(where: $where) { ...F } # mutation m { z }
        }
        fragment F on pokemon { id }`;

        const res = await post({ query });

        expect(res.status).toBe(200);
    });
});

describe("POST /graphql: caching", () => {
    it("caches a miss on disk and serves it as JSON", async () => {
        const body = { data: { pokemon: [{ id: 1 }] } };
        fetchMock.mockImplementation(async () => jsonResponse(body));

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toMatch(/application\/json/);
        expect(await res.json()).toEqual(body);
        const file = await onlyGraphqlFile();
        expect(path.basename(file)).toMatch(/^[0-9a-f]{64}\.json$/);
        expect(JSON.parse(await fs.readFile(file, "utf8"))).toEqual(body);
    });

    it("rewrites sprite and cry URLs to same-origin asset URLs", async () => {
        fetchMock.mockImplementation(async () =>
            jsonResponse({
                data: {
                    sprite: `${ASSET_HOST}${SPRITE}`,
                    cry: `${ASSET_HOST}cries/main/cries/pokemon/latest/1.ogg`,
                    again: `${ASSET_HOST}${SPRITE}`,
                },
            })
        );

        const res = await post({ query: POKEDEX });

        const expected = {
            data: {
                sprite: `/pokeapi/assets/${SPRITE}`,
                cry: "/pokeapi/assets/cries/main/cries/pokemon/latest/1.ogg",
                again: `/pokeapi/assets/${SPRITE}`,
            },
        };
        expect(await res.json()).toEqual(expected);
        const cached = await fs.readFile(await onlyGraphqlFile(), "utf8");
        expect(JSON.parse(cached)).toEqual(expected);
    });

    it("serves a fresh hit without calling upstream or touching the file", async () => {
        const first = jsonResponse({ data: { n: 1 } });
        fetchMock.mockResolvedValueOnce(first);
        await post({ query: POKEDEX });
        const file = await onlyGraphqlFile();
        await backdate(file, 12 * 60 * 60 * 1000);
        const before = await mtime(file);

        const res = await post({ query: POKEDEX });
        await new Promise((resolve) => realSetTimeout(resolve, 50));

        expect(await res.json()).toEqual({ data: { n: 1 } });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(await mtime(file)).toBe(before);
    });

    it("refetches and rewrites an expired entry", async () => {
        fetchMock.mockImplementationOnce(async () =>
            jsonResponse({ data: { n: 1 } })
        );
        await post({ query: POKEDEX });
        const file = await onlyGraphqlFile();
        await backdate(file, DAY + 60 * 1000);
        fetchMock.mockImplementationOnce(async () =>
            jsonResponse({ data: { n: 2 } })
        );

        const res = await post({ query: POKEDEX });

        expect(await res.json()).toEqual({ data: { n: 2 } });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(Date.now() - (await mtime(file))).toBeLessThan(60 * 1000);
    });

    it("keeps an entry just under 24 h old fresh", async () => {
        fetchMock.mockImplementation(async () =>
            jsonResponse({ data: { n: 1 } })
        );
        await post({ query: POKEDEX });
        await backdate(await onlyGraphqlFile(), DAY - 60 * 1000);

        await post({ query: POKEDEX });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("keys the cache on the variables", async () => {
        fetchMock.mockImplementation(async (_url, init) =>
            jsonResponse({ data: JSON.parse(init.body).variables })
        );

        const a = await post({ query: INFO, variables: { id: 1 } });
        const b = await post({ query: INFO, variables: { id: 2 } });
        const a2 = await post({ query: INFO, variables: { id: 1 } });

        expect(await a.json()).toEqual({ data: { id: 1 } });
        expect(await b.json()).toEqual({ data: { id: 2 } });
        expect(await a2.json()).toEqual({ data: { id: 1 } });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(await graphqlFiles()).toHaveLength(2);
    });

    it("treats a missing and a null variables value the same", async () => {
        fetchMock.mockImplementation(async () =>
            jsonResponse({ data: { n: 1 } })
        );

        await post({ query: POKEDEX });
        await post({ query: POKEDEX, variables: null });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("shares one upstream call between concurrent identical requests", async () => {
        let release;
        fetchMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    release = () => resolve(jsonResponse({ data: { n: 1 } }));
                })
        );

        const pending = Array.from({ length: 5 }, () =>
            post({ query: POKEDEX })
        );
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
        release();
        const responses = await Promise.all(pending);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        for (const res of responses) {
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ data: { n: 1 } });
        }
    });

    it("does not share a failed call with later requests", async () => {
        fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
        const failed = await post({ query: POKEDEX });
        fetchMock.mockImplementationOnce(async () =>
            jsonResponse({ data: { n: 1 } })
        );

        const retried = await post({ query: POKEDEX });

        expect(failed.status).toBe(502);
        expect(retried.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});

describe("POST /graphql: upstream failures", () => {
    const seedStale = async (data = { n: "stale" }) => {
        fetchMock.mockImplementationOnce(async () => jsonResponse({ data }));
        await post({ query: POKEDEX });
        const file = await onlyGraphqlFile();
        await backdate(file, 2 * DAY);
        return { file, mtimeBefore: await mtime(file) };
    };

    it.each([
        ["a 500", () => Promise.resolve(new Response("", { status: 500 }))],
        ["a network error", () => Promise.reject(new Error("ECONNRESET"))],
    ])("serves a stale entry on %s and leaves it stale", async (_n, fail) => {
        const { file, mtimeBefore } = await seedStale();
        fetchMock.mockImplementation(fail);

        const res = await post({ query: POKEDEX });
        await new Promise((resolve) => realSetTimeout(resolve, 50));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ data: { n: "stale" } });
        expect(await mtime(file)).toBe(mtimeBefore);
    });

    it("retries upstream on the next request after serving stale", async () => {
        await seedStale();
        fetchMock.mockImplementationOnce(
            async () => new Response("", { status: 503 })
        );
        await post({ query: POKEDEX });
        fetchMock.mockImplementationOnce(async () =>
            jsonResponse({ data: { n: "fresh" } })
        );

        const res = await post({ query: POKEDEX });

        expect(await res.json()).toEqual({ data: { n: "fresh" } });
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it.each([
        ["a 500", () => Promise.resolve(new Response("", { status: 500 }))],
        ["a network error", () => Promise.reject(new Error("ECONNRESET"))],
    ])("answers 502 on %s with nothing cached", async (_n, fail) => {
        fetchMock.mockImplementation(fail);

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: "Upstream request failed" });
        expect(await graphqlFiles()).toEqual([]);
    });

    it("does not cache a 200 response carrying GraphQL errors", async () => {
        fetchMock.mockImplementation(async () =>
            jsonResponse({ errors: [{ message: "field not found" }] })
        );

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(502);
        expect(await graphqlFiles()).toEqual([]);
    });

    it.each([
        ["an HTML page", "<html>Bad gateway</html>"],
        ["an empty body", ""],
        ["truncated JSON", '{"data": {"pokemon": ['],
        ["a JSON value that is not an object", "null"],
    ])("does not cache a 200 response that is %s", async (_n, text) => {
        fetchMock.mockImplementation(async () => jsonResponse(text));

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(502);
        expect(await graphqlFiles()).toEqual([]);
    });

    it("keeps serving the stale entry when upstream returns GraphQL errors", async () => {
        await seedStale();
        fetchMock.mockImplementation(async () =>
            jsonResponse({ errors: [{ message: "boom" }] })
        );

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ data: { n: "stale" } });
    });

    it.each([
        ["empty", ""],
        ["truncated", '{"data": {"pokemon": ['],
    ])("refetches when a fresh cache file is %s", async (_n, content) => {
        fetchMock.mockImplementation(async () =>
            jsonResponse({ data: { n: 1 } })
        );
        const hash = createHash("sha256")
            .update(JSON.stringify([POKEDEX, null]))
            .digest("hex");
        await seed(`graphql/${hash}.json`, content);

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ data: { n: 1 } });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not serve a corrupt stale file when upstream is down", async () => {
        const { file } = await seedStale();
        await fs.writeFile(file, '{"data": {"pokemon": [');
        await backdate(file, 2 * DAY);
        fetchMock.mockImplementation(
            async () => new Response("", { status: 500 })
        );

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(502);
    });

    it("leaves the old file intact when writing the new one fails midway", async () => {
        const { file } = await seedStale();
        const oldContent = await fs.readFile(file, "utf8");
        const realWriteFile = fs.writeFile;
        vi.spyOn(fs, "writeFile").mockImplementationOnce(
            async (target, data) => {
                await realWriteFile(target, String(data).slice(0, 5));
                throw new Error("ENOSPC");
            }
        );
        fetchMock.mockImplementation(async () =>
            jsonResponse({ data: { n: "new" } })
        );

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ data: { n: "stale" } });
        expect(await fs.readFile(file, "utf8")).toBe(oldContent);
        expect(await graphqlFiles()).toEqual([file]);
    });

    it("leaves no temp files behind after a successful write", async () => {
        fetchMock.mockImplementation(async () =>
            jsonResponse({ data: { n: 1 } })
        );

        await post({ query: POKEDEX });

        const files = await listFiles(cacheDir);
        expect(files.map((file) => path.extname(file))).toEqual([".json"]);
    });
});

describe("upstream 429 handling", () => {
    it("retries after the Retry-After delay and then succeeds", async () => {
        const sleeps = recordSleeps();
        fetchMock
            .mockResolvedValueOnce(tooMany("3"))
            .mockImplementationOnce(async () =>
                jsonResponse({ data: { n: 1 } })
            );

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(200);
        expect(sleeps).toEqual([3000]);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("caps the wait at 10 seconds", async () => {
        const sleeps = recordSleeps();
        fetchMock
            .mockResolvedValueOnce(tooMany("999"))
            .mockImplementationOnce(async () => jsonResponse({ data: {} }));

        await post({ query: POKEDEX });

        expect(sleeps).toEqual([10000]);
    });

    it.each([
        ["missing", undefined],
        ["an HTTP date", "Wed, 21 Oct 2026 07:28:00 GMT"],
        ["not a number", "soon"],
    ])("backs off 2 s then 4 s when Retry-After is %s", async (_n, header) => {
        const sleeps = recordSleeps();
        fetchMock
            .mockResolvedValueOnce(tooMany(header))
            .mockResolvedValueOnce(tooMany(header))
            .mockImplementationOnce(async () => jsonResponse({ data: {} }));

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(200);
        expect(sleeps).toEqual([2000, 4000]);
    });

    it("gives up after three tries", async () => {
        recordSleeps();
        fetchMock.mockImplementation(async () => tooMany("1"));

        const res = await post({ query: POKEDEX });

        expect(res.status).toBe(502);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(await graphqlFiles()).toEqual([]);
    });

    it("serves a stale entry once the retries are exhausted", async () => {
        fetchMock.mockImplementationOnce(async () =>
            jsonResponse({ data: { n: "stale" } })
        );
        await post({ query: POKEDEX });
        await backdate(await onlyGraphqlFile(), 2 * DAY);
        recordSleeps();
        fetchMock.mockImplementation(async () => tooMany("1"));

        const res = await post({ query: POKEDEX });

        expect(await res.json()).toEqual({ data: { n: "stale" } });
    });

    it("retries asset downloads too", async () => {
        const sleeps = recordSleeps();
        fetchMock
            .mockResolvedValueOnce(tooMany("1"))
            .mockImplementationOnce(async () => new Response("png"));

        const res = await getAsset(SPRITE);

        expect(res.status).toBe(200);
        expect(sleeps).toEqual([1000]);
    });
});

describe("GET /assets", () => {
    it("downloads a miss, caches it, and serves it immutable", async () => {
        fetchMock.mockImplementation(
            async () => new Response(new Uint8Array([1, 2, 3]))
        );

        const res = await getAsset(SPRITE);

        expect(res.status).toBe(200);
        expect(new Uint8Array(await res.arrayBuffer())).toEqual(
            new Uint8Array([1, 2, 3])
        );
        expect(res.headers.get("content-type")).toBe("image/png");
        expect(res.headers.get("cache-control")).toBe(
            "public, max-age=31536000, immutable"
        );
        expect(res.headers.get("cross-origin-resource-policy")).toBe(
            "cross-origin"
        );
        expect(fetchMock.mock.calls[0][0]).toBe(`${ASSET_HOST}${SPRITE}`);
        const cached = await fs.readFile(path.join(cacheDir, "assets", SPRITE));
        expect([...cached]).toEqual([1, 2, 3]);
    });

    it.each([
        ["png", "image/png"],
        ["gif", "image/gif"],
        ["svg", "image/svg+xml"],
        ["webp", "image/webp"],
        ["ogg", "audio/ogg"],
    ])("serves .%s as %s", async (ext, type) => {
        fetchMock.mockImplementation(async () => new Response("x"));

        const res = await getAsset(`sprites/master/1.${ext}`);

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe(type);
    });

    it("serves a hit without calling upstream and refreshes its mtime", async () => {
        const file = await seed(`assets/${SPRITE}`, "cached", 10 * DAY);
        const before = await mtime(file);

        const res = await getAsset(SPRITE);

        expect(await res.text()).toBe("cached");
        expect(fetchMock).not.toHaveBeenCalled();
        await vi.waitFor(async () =>
            expect(await mtime(file)).toBeGreaterThan(before + 9 * DAY)
        );
    });

    it("passes an upstream 404 through and caches nothing", async () => {
        fetchMock.mockImplementation(
            async () => new Response("", { status: 404 })
        );

        const res = await getAsset(SPRITE);

        expect(res.status).toBe(404);
        expect(await listFiles(cacheDir)).toEqual([]);
    });

    it("answers 502 on a network error and caches nothing", async () => {
        fetchMock.mockImplementation(() =>
            Promise.reject(new Error("ECONNRESET"))
        );

        const res = await getAsset(SPRITE);

        expect(res.status).toBe(502);
        expect(await listFiles(cacheDir)).toEqual([]);
    });

    it("shares one download between concurrent identical requests", async () => {
        let release;
        fetchMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    release = () => resolve(new Response("png"));
                })
        );

        const pending = Array.from({ length: 5 }, () => getAsset(SPRITE));
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
        release();
        const responses = await Promise.all(pending);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        for (const res of responses) {
            expect(await res.text()).toBe("png");
        }
    });

    it("leaves no partial file when the download write fails", async () => {
        fetchMock.mockImplementation(async () => new Response("png-bytes"));
        const realWriteFile = fs.writeFile;
        vi.spyOn(fs, "writeFile").mockImplementationOnce(
            async (target, data) => {
                await realWriteFile(target, data.subarray(0, 3));
                throw new Error("ENOSPC");
            }
        );

        const res = await getAsset(SPRITE);

        expect(res.status).toBe(502);
        expect(await listFiles(cacheDir)).toEqual([]);
    });

    it.each([
        ["a parent segment", "sprites/../../secret.png"],
        ["an encoded parent segment", "sprites/%2e%2e/%2e%2e/secret.png"],
        ["an encoded slash parent", "sprites%2F..%2Fsecret.png"],
        ["a dotted name", "sprites/a..b.png"],
        ["an empty segment", "sprites//1.png"],
        ["a hidden file", "sprites/.hidden.png"],
        ["a hidden directory", "sprites/.git/1.png"],
        ["a directory that is not allowed", "other/1.png"],
        ["no directory", "1.png"],
        ["an upper-case extension", "sprites/1.PNG"],
        ["an extension that is not allowed", "sprites/1.html"],
        ["no extension", "sprites/1"],
        ["a query-less script", "sprites/1.png/../../x.js"],
        ["a backslash", "sprites/..\\..\\1.png"],
        ["a null byte", "sprites/1%00.png"],
    ])("rejects %s", async (_name, assetPath) => {
        const status = await rawGet(`/pokeapi/assets/${assetPath}`);

        expect(status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(await listFiles(cacheDir)).toEqual([]);
    });

    it("accepts nested version paths and digits in names", async () => {
        fetchMock.mockImplementation(async () => new Response("x"));

        const res = await getAsset(
            "sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/25.png"
        );

        expect(res.status).toBe(200);
    });
});

describe("sweepCache", () => {
    it("removes files unused for more than 30 days and keeps the rest", async () => {
        const old = await seed(`assets/${SPRITE}`, "old", 40 * DAY);
        const recent = await seed(
            "assets/sprites/master/2.png",
            "new",
            2 * DAY
        );
        const oldJson = await seed("graphql/old.json", "{}", 31 * DAY);
        const recentJson = await seed("graphql/new.json", "{}", 29 * DAY);

        await proxy.sweepCache();

        expect(await listFiles(cacheDir)).toEqual([recent, recentJson].sort());
        for (const gone of [old, oldJson]) {
            await expect(fs.stat(gone)).rejects.toThrow();
        }
    });

    it("logs how many files it removed", async () => {
        await seed("graphql/a.json", "{}", 40 * DAY);
        await seed("graphql/b.json", "{}", 40 * DAY);

        await proxy.sweepCache();

        expect(console.log).toHaveBeenCalledWith(
            "Evicted 2 stale cache file(s) from api/.cache"
        );
    });

    it("stays quiet when nothing is stale", async () => {
        await seed("graphql/a.json", "{}", DAY);

        await proxy.sweepCache();

        expect(console.log).not.toHaveBeenCalled();
    });

    it("resolves when the cache directory does not exist", async () => {
        await fs.rm(cacheDir, { recursive: true, force: true });

        await expect(proxy.sweepCache()).resolves.toBeUndefined();
    });

    it("resolves on an empty cache directory", async () => {
        await expect(proxy.sweepCache()).resolves.toBeUndefined();
        expect(console.log).not.toHaveBeenCalled();
    });

    it("survives a file that cannot be removed and does not count it", async () => {
        await seed("graphql/a.json", "{}", 40 * DAY);
        await seed("graphql/b.json", "{}", 40 * DAY);
        vi.spyOn(fs, "unlink").mockRejectedValueOnce(
            Object.assign(new Error("gone"), { code: "ENOENT" })
        );

        await expect(proxy.sweepCache()).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(
            "Evicted 1 stale cache file(s) from api/.cache"
        );
    });

    it("survives a file that vanishes before it is inspected", async () => {
        await seed("graphql/a.json", "{}", 40 * DAY);
        const b = await seed("graphql/b.json", "{}", 40 * DAY);
        const realStat = fs.stat;
        vi.spyOn(fs, "stat").mockImplementation(async (target, ...rest) => {
            if (target === b) {
                throw Object.assign(new Error("gone"), { code: "ENOENT" });
            }
            return realStat(target, ...rest);
        });

        await expect(proxy.sweepCache()).resolves.toBeUndefined();
    });

    it("uses POKEAPI_CACHE_MAX_AGE_DAYS", async () => {
        const custom = loadProxy({ POKEAPI_CACHE_MAX_AGE_DAYS: "7" });
        const stale = await seed("graphql/stale.json", "{}", 10 * DAY);
        const kept = await seed("graphql/kept.json", "{}", 5 * DAY);

        await custom.sweepCache();

        await expect(fs.stat(stale)).rejects.toThrow();
        await expect(fs.stat(kept)).resolves.toBeTruthy();
    });

    it("accepts a fractional number of days", async () => {
        const custom = loadProxy({ POKEAPI_CACHE_MAX_AGE_DAYS: "0.5" });
        const stale = await seed("graphql/stale.json", "{}", DAY);
        const kept = await seed("graphql/kept.json", "{}", DAY / 4);

        await custom.sweepCache();

        await expect(fs.stat(stale)).rejects.toThrow();
        await expect(fs.stat(kept)).resolves.toBeTruthy();
    });

    it.each([
        ["not a number", "abc"],
        ["empty", ""],
        ["zero", "0"],
        ["negative", "-5"],
        ["infinite", "Infinity"],
        ["not finite", "NaN"],
    ])("falls back to 30 days when the variable is %s", async (_n, value) => {
        const custom = loadProxy({ POKEAPI_CACHE_MAX_AGE_DAYS: value });
        const stale = await seed("graphql/stale.json", "{}", 40 * DAY);
        const kept = await seed("graphql/kept.json", "{}", 20 * DAY);

        await custom.sweepCache();

        await expect(fs.stat(stale)).rejects.toThrow();
        await expect(fs.stat(kept)).resolves.toBeTruthy();
    });
});
