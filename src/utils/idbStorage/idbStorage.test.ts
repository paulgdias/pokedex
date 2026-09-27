import { afterEach, describe, expect, it, vi } from "vitest";

import { idbStorage, removeLegacyLocalStorageCache } from ".";

afterEach(() => {
    vi.restoreAllMocks();
});

// the module caches its open database, so the failure cases run first,
// before any call has succeeded
describe("idbStorage when IndexedDB fails", () => {
    it("returns null when opening throws", async () => {
        vi.spyOn(indexedDB, "open").mockImplementation(() => {
            throw new Error("blocked");
        });

        expect(await idbStorage.getItem("key")).toBeNull();
        await expect(
            idbStorage.setItem("key", "value")
        ).resolves.toBeUndefined();
        await expect(idbStorage.removeItem("key")).resolves.toBeUndefined();
    });

    it("returns null when opening reports an error", async () => {
        vi.spyOn(indexedDB, "open").mockImplementation(() => {
            const request = { error: new Error("denied") } as IDBOpenDBRequest;
            queueMicrotask(() => request.onerror?.(new Event("error")));
            return request;
        });

        expect(await idbStorage.getItem("key")).toBeNull();
    });

    it("recovers once IndexedDB works again", async () => {
        await idbStorage.setItem("recovered", "yes");
        expect(await idbStorage.getItem("recovered")).toBe("yes");
        await idbStorage.removeItem("recovered");
    });

    it("returns null when a request fails after opening", async () => {
        await idbStorage.setItem("warm", "up");
        vi.spyOn(IDBObjectStore.prototype, "get").mockImplementation(() => {
            const request = { error: new Error("read failed") } as IDBRequest;
            queueMicrotask(() => request.onerror?.(new Event("error")));
            return request;
        });

        expect(await idbStorage.getItem("warm")).toBeNull();
        vi.restoreAllMocks();
        // a failed request resets the connection; the next call reopens it
        expect(await idbStorage.getItem("warm")).toBe("up");
        await idbStorage.removeItem("warm");
    });
});

describe("idbStorage", () => {
    it("returns null for a key that was never set", async () => {
        expect(await idbStorage.getItem("missing")).toBeNull();
    });

    it("stores and reads back a value", async () => {
        await idbStorage.setItem("greeting", "hello");
        expect(await idbStorage.getItem("greeting")).toBe("hello");
    });

    it("overwrites an existing value", async () => {
        await idbStorage.setItem("count", "1");
        await idbStorage.setItem("count", "2");
        expect(await idbStorage.getItem("count")).toBe("2");
    });

    it("removes a value", async () => {
        await idbStorage.setItem("gone", "soon");
        await idbStorage.removeItem("gone");
        expect(await idbStorage.getItem("gone")).toBeNull();
    });

    it("keeps keys apart", async () => {
        await idbStorage.setItem("a", "1");
        await idbStorage.setItem("b", "2");
        await idbStorage.removeItem("a");
        expect(await idbStorage.getItem("b")).toBe("2");
    });

    it("holds values far beyond localStorage's ~5 MB quota", async () => {
        const big = "x".repeat(8 * 1024 * 1024);
        await idbStorage.setItem("big", big);
        expect((await idbStorage.getItem("big"))?.length).toBe(big.length);
        await idbStorage.removeItem("big");
    });

    it("persists in the pokedex-cache database", async () => {
        await idbStorage.setItem("where", "here");
        const databases = await indexedDB.databases();
        expect(databases.map(({ name }) => name)).toContain("pokedex-cache");
    });
});

describe("removeLegacyLocalStorageCache", () => {
    it("removes the old React Query key and leaves others alone", () => {
        localStorage.setItem("REACT_QUERY_OFFLINE_CACHE", "old");
        localStorage.setItem("theme", "dark");

        removeLegacyLocalStorageCache();

        expect(localStorage.getItem("REACT_QUERY_OFFLINE_CACHE")).toBeNull();
        expect(localStorage.getItem("theme")).toBe("dark");
        localStorage.removeItem("theme");
    });

    it("does not throw when storage is blocked", () => {
        vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        expect(() => removeLegacyLocalStorageCache()).not.toThrow();
    });
});
