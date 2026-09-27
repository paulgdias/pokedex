import type { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";

import LoadingSpinner from "@components/LoadingSpinner";

import Home from "../../pages/Home";
import Layout from "../../pages/Layout";
import { pokedexLoader } from "../pokedexLoader";

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

/** The app's routes, apart from the router that runs them. */
export const createAppRoutes = (queryClient: QueryClient): RouteObject[] => {
    const pokedexError =
        "There was an error loading the Pokédex. Please try again.";
    const loader = pokedexLoader(queryClient);

    return [
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
                    () => import("../../pages/Pokedex"),
                    loader,
                    pokedexError
                ),
                dataRoute(
                    "pokemon",
                    "/pokedex/:pokemon",
                    () => import("../../pages/Pokemon"),
                    loader,
                    pokedexError
                ),
                dataRoute(
                    "compare",
                    "/compare",
                    () => import("../../pages/Compare"),
                    loader,
                    pokedexError
                ),
                {
                    path: "/types",
                    lazy: async () => ({
                        Component: (await import("../../pages/TypeChart"))
                            .default,
                    }),
                    HydrateFallback: LoadingSpinner,
                },
            ],
        },
    ];
};

export const createAppRouter = (queryClient: QueryClient) =>
    createBrowserRouter(createAppRoutes(queryClient));
