import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { I18nProvider } from "react-aria";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { idbStorage, removeLegacyLocalStorageCache } from "./utils/idbStorage";
import { createAppRouter } from "./utils/routes";
import { initTheme } from "./utils/useTheme";

import "./styles/index.css";

initTheme();

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const ONE_DAY = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: ONE_DAY,
            gcTime: ONE_DAY,
        },
    },
});

// IndexedDB instead of localStorage: no ~5 MB quota, no synchronous writes
removeLegacyLocalStorageCache();
const persister = createAsyncStoragePersister({ storage: idbStorage });

const router = createAppRouter(queryClient);

const root = createRoot(container);
root.render(
    <I18nProvider locale="en-US">
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister, maxAge: ONE_DAY }}
        >
            <RouterProvider router={router} />
        </PersistQueryClientProvider>
    </I18nProvider>
);
