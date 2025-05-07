import React from "react";
import { createRoot } from "react-dom/client";

import { I18nProvider } from "react-aria";

import Layout from "./pages/Layout";
import Home from "./pages/Home";

import { routes } from "./utils/routes";

import "./styles/index.css";

import { createBrowserRouter, RouterProvider } from "react-router";

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const additionalRoutes = [...routes.entries()].map(([key, value]) => {
    return { path: key, element: React.createElement(value) };
});

const router = createBrowserRouter([
    {
        path: "/",
        element: React.createElement(Layout),
        children: [
            { index: true, element: React.createElement(Home) },
            ...additionalRoutes,
        ],
    },
]);

const root = createRoot(container);
root.render(
    <I18nProvider locale="en-US">
        <RouterProvider router={router} />
    </I18nProvider>
);
