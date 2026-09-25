import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { I18nProvider } from "react-aria";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

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

const persister = createAsyncStoragePersister({
    storage: window.localStorage,
});

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
