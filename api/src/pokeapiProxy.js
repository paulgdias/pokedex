const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { Router } = require("express");

const GRAPHQL_URL = "https://beta.pokeapi.co/graphql/v1beta";
const ASSET_HOST = "https://raw.githubusercontent.com/PokeAPI/";
const ASSET_PREFIX = "/pokeapi/assets/";

// overridable so the tests can use a temp dir
const CACHE_DIR =
    process.env.POKEAPI_CACHE_DIR || path.join(__dirname, "../.cache");
const FRESH_MS = 24 * 60 * 60 * 1000;
const MAX_TRIES = 3;
// files unused for this long are evicted on startup; override with the env var
const envDays = Number(process.env.POKEAPI_CACHE_MAX_AGE_DAYS);
const MAX_AGE_DAYS = Number.isFinite(envDays) && envDays > 0 ? envDays : 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

// only the operations the app sends, so this is not an open proxy
const OPERATIONS = new Set(["getPokedex", "getPokemonInfo", "getTypeEfficacy"]);
const OPERATION_KEYWORDS = new Set(["query", "mutation", "subscription"]);
// no empty, hidden or ".." segments
const ASSET_PATH = /^(sprites|cries)(\/[\w-][\w.-]*)+\.(png|gif|svg|webp|ogg)$/;

const CONTENT_TYPES = {
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ogg": "audio/ogg",
};

// identical concurrent requests share one upstream call
const inFlight = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shared = (key, load) => {
    if (!inFlight.has(key)) {
        inFlight.set(
            key,
            load().finally(() => inFlight.delete(key))
        );
    }
    return inFlight.get(key);
};

/** fetch that waits out 429s, honouring Retry-After. */
const fetchUpstream = async (url, init) => {
    for (let attempt = 1; ; attempt++) {
        const response = await fetch(url, init);
        if (response.status !== 429 || attempt === MAX_TRIES) {
            return response;
        }
        const wait = Number(response.headers.get("retry-after")) || attempt * 2;
        await sleep(Math.min(wait, 10) * 1000);
    }
};

const readFile = (file) => fs.readFile(file).catch(() => null);

// writes beside the target and renames, so a crash, a full disk or a request
// arriving mid-write never leaves or reads a partial cache file
const writeFile = async (file, data) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.${crypto.randomUUID()}.tmp`;
    try {
        await fs.writeFile(temp, data);
        await fs.rename(temp, file);
    } catch (error) {
        await fs.unlink(temp).catch(() => {});
        throw error;
    }
};

/** a usable GraphQL response is a JSON object without `errors`. */
const isUsable = (text) => {
    try {
        const body = JSON.parse(text);
        return (
            body !== null &&
            typeof body === "object" &&
            !Array.isArray(body) &&
            body.errors === undefined
        );
    } catch {
        return false;
    }
};

const readUsable = async (file) => {
    const text = await readFile(file);
    return text !== null && isUsable(text) ? text : null;
};

/**
 * counts the operations in a GraphQL document (fragments do not), so a second
 * operation cannot ride along behind an allowed name. Only top-level tokens
 * matter: braces and parentheses nest, and strings and comments are dropped.
 */
const countOperations = (query) => {
    const source = query.replace(
        /"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|#[^\n]*/g,
        " "
    );
    let depth = 0;
    let count = 0;
    // what the next top-level "{" opens
    let next = "shorthand";
    for (const [token] of source.matchAll(/[{}()[\]]|\w+/g)) {
        if ("{([".includes(token)) {
            if (depth === 0 && token === "{") {
                if (next === "shorthand") {
                    count++;
                }
                next = "shorthand";
            }
            depth++;
        } else if ("})]".includes(token)) {
            depth--;
        } else if (depth === 0) {
            if (token === "fragment") {
                next = "fragment";
            } else if (OPERATION_KEYWORDS.has(token) && next !== "fragment") {
                count++;
                next = "operation";
            }
        }
    }
    return count;
};

const age = async (file) => {
    const stat = await fs.stat(file).catch(() => null);
    return stat ? Date.now() - stat.mtimeMs : Number.POSITIVE_INFINITY;
};

// Resets a file's mtime to "last used". Only for assets, so sweepCache keeps
// the ones still being read. Never for GraphQL files: their mtime is the fetch
// time that age() checks for freshness.
const touch = (file) => {
    const now = new Date();
    fs.utimes(file, now, now).catch(() => {});
};

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

/** deletes cache files unused for MAX_AGE_MS; run once on startup. */
const sweepCache = async () => {
    const cutoff = Date.now() - MAX_AGE_MS;
    const files = await listFiles(CACHE_DIR);
    let removed = 0;
    for (const file of files) {
        const stat = await fs.stat(file).catch(() => null);
        if (stat && stat.mtimeMs < cutoff) {
            if (
                await fs.unlink(file).then(
                    () => true,
                    () => false
                )
            ) {
                removed++;
            }
        }
    }
    if (removed) {
        console.log(`Evicted ${removed} stale cache file(s) from api/.cache`);
    }
};

const graphqlCacheFile = (query, variables) => {
    const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify([query, variables ?? null]))
        .digest("hex");
    return path.join(CACHE_DIR, "graphql", `${hash}.json`);
};

const loadGraphql = async (file, body) => {
    const response = await fetchUpstream(GRAPHQL_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
    });
    if (!response.ok) {
        throw new Error(`upstream responded ${response.status}`);
    }
    // sprite and cry URLs come back same-origin, served by /assets below
    const text = (await response.text()).replaceAll(ASSET_HOST, ASSET_PREFIX);
    // a 200 can still carry GraphQL errors or an error page; don't cache those
    if (!isUsable(text)) {
        throw new Error("upstream returned an unusable response");
    }
    await writeFile(file, text);
    return text;
};

const router = Router();

router.post("/graphql", async (req, res) => {
    const { query, variables } = req.body ?? {};
    const operation =
        typeof query === "string" && /^\s*query\s+(\w+)/.exec(query)?.[1];
    if (
        !operation ||
        !OPERATIONS.has(operation) ||
        countOperations(query) !== 1
    ) {
        return res.status(400).json({ error: "Operation not allowed" });
    }

    const file = graphqlCacheFile(query, variables);
    try {
        let text = (await age(file)) < FRESH_MS ? await readUsable(file) : null;
        if (text === null) {
            const body = JSON.stringify({ query, variables });
            try {
                text = await shared(file, () => loadGraphql(file, body));
            } catch (error) {
                // serve stale rather than fail when upstream is down
                text = await readUsable(file);
                if (text === null) {
                    throw error;
                }
                console.warn(`Serving stale ${operation}: ${error.message}`);
            }
        }
        res.type("json").send(text);
    } catch (error) {
        console.error(error);
        res.status(502).json({ error: "Upstream request failed" });
    }
});

router.get("/assets/*path", async (req, res) => {
    const assetPath = req.params.path.join("/");
    if (!ASSET_PATH.test(assetPath) || assetPath.includes("..")) {
        return res.status(400).send("Asset not allowed");
    }

    const file = path.join(CACHE_DIR, "assets", assetPath);
    try {
        let data = await readFile(file);
        if (data === null) {
            const result = await shared(file, async () => {
                const response = await fetchUpstream(ASSET_HOST + assetPath);
                if (!response.ok) {
                    return { status: response.status };
                }
                const bytes = Buffer.from(await response.arrayBuffer());
                await writeFile(file, bytes);
                return { bytes };
            });
            if (!result.bytes) {
                return res.status(result.status).send("Asset not found");
            }
            data = result.bytes;
        } else {
            touch(file);
        }
        res.set({
            "Cache-Control": "public, max-age=31536000, immutable",
            // helmet defaults to same-origin, which would block the images
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Content-Type":
                CONTENT_TYPES[path.extname(assetPath)] ??
                "application/octet-stream",
        });
        res.send(data);
    } catch (error) {
        console.error(error);
        res.status(502).send("Upstream request failed");
    }
});

module.exports = { router, sweepCache };
