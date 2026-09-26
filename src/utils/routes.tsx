import type { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";

import LoadingSpinner from "@components/LoadingSpinner";

import Home from "../pages/Home";
import Layout from "../pages/Layout";
import { pokedexLoader } from "./pokedexLoader";

type PageModule = { default: React.ComponentType };

/**
 * A page is downloaded on first visit (`lazy`), while its data loader runs
 * straight away, so the two overlap instead of queueing.
 */
const dataRoute = (
    id: string,
    path: string,
    importPage: () => Promise<PageModule>,
    loader: RouteObject["loader"],
    errorMessage: string
): RouteObject => ({
    id,
    path,
    loader,
    lazy: async () => ({ Component: (await importPage()).default }),
    errorElement: <div>{errorMessage}</div>,
    HydrateFallback: LoadingSpinner,
});

export const createAppRouter = (queryClient: QueryClient) => {
    const pokedexError =
        "There was an error loading the Pokédex. Please try again.";
    const loader = pokedexLoader(queryClient);

    return createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            HydrateFallback: LoadingSpinner,
            children: [
                {
                    index: true,
                    element: <Home />,
                    HydrateFallback: LoadingSpinner,
                },
                dataRoute(
                    "pokedex",
                    "/pokedex",
                    () => import("../pages/Pokedex"),
                    loader,
                    pokedexError
                ),
                dataRoute(
                    "pokemon",
                    "/pokedex/:pokemon",
                    () => import("../pages/Pokemon"),
                    loader,
                    pokedexError
                ),
                dataRoute(
                    "compare",
                    "/compare",
                    () => import("../pages/Compare"),
                    loader,
                    pokedexError
                ),
                {
                    path: "/types",
                    lazy: async () => ({
                        Component: (await import("../pages/TypeChart")).default,
                    }),
                    HydrateFallback: LoadingSpinner,
                },
                {
                    id: "teams",
                    path: "/teams",
                    lazy: async () => {
                        const page = await import("../pages/Teams");
                        return {
                            Component: page.default,
                            loader: page.loader(queryClient),
                        };
                    },
                    errorElement: (
                        <div>
                            There was an error loading teams. Please try again.
                        </div>
                    ),
                    HydrateFallback: LoadingSpinner,
                },
            ],
        },
    ]);
};
