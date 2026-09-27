/**
 * A minimal async key-value store on IndexedDB, shaped like the storage the
 * React Query persister expects (`getItem` / `setItem` / `removeItem`).
 * IndexedDB has no ~5 MB quota like localStorage and doesn't block the main
 * thread. Every call swallows failures (private windows, blocked storage), so
 * the app just runs without a persisted cache.
 */
const DB_NAME = "pokedex-cache";
const STORE = "keyval";

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = () => {
    dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    return dbPromise;
};

const run = async <T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> => {
    try {
        const db = await openDatabase();
        return await new Promise<T>((resolve, reject) => {
            const request = action(
                db.transaction(STORE, mode).objectStore(STORE)
            );
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch {
        dbPromise = null;
        return null;
    }
};

export const idbStorage = {
    getItem: async (key: string) =>
        (await run<string | undefined>("readonly", (store) =>
            store.get(key)
        )) ?? null,
    setItem: async (key: string, value: string) => {
        await run("readwrite", (store) => store.put(value, key));
    },
    removeItem: async (key: string) => {
        await run("readwrite", (store) => store.delete(key));
    },
};

/** The cache used to live in localStorage; drop it to free that space. */
export const removeLegacyLocalStorageCache = () => {
    try {
        localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
    } catch {
        // storage can be blocked
    }
};
