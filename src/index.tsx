import React from "react";

import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { I18nProvider } from "react-aria";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "./pages/Layout";
import { loader as pokedexLoader } from "./pages/Pokedex";
import { loader as teamsLoader } from "./pages/Teams";
import Home from "./pages/Home";

import { routes } from "./utils/routes";

import Pokeball from "@components/Icons/Pokeball";

import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const queryClient = new QueryClient();

const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center h-screen animate-spin">
            <Pokeball width={52} height={52} />
        </div>
    );
};

const additionalRoutes = [...routes.entries()].map(([key, value]) => {
    if (key.includes("/pokedex")) {
        return {
            path: key,
            element: React.createElement(value),
            HydrateFallback: LoadingSpinner,
            loader: pokedexLoader(queryClient),
        };
    }
    if (key.includes("/teams")) {
        return {
            path: key,
            element: React.createElement(value),
            HydrateFallback: LoadingSpinner,
            loader: teamsLoader(queryClient),
        };
    }
    return {
        path: key,
        element: React.createElement(value),
    };
});

const router = createBrowserRouter([
    {
        path: "/",
        element: React.createElement(Layout),
        HydrateFallback: LoadingSpinner,
        children: [
            {
                index: true,
                element: React.createElement(Home),
                HydrateFallback: LoadingSpinner,
            },
            ...additionalRoutes,
        ],
    },
]);

const root = createRoot(container);
root.render(
    <I18nProvider locale="en-US">
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </I18nProvider>
);
