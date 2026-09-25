import type { QueryClient } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";

import LoadingSpinner from "@components/LoadingSpinner";

import Home from "../pages/Home";
import Layout from "../pages/Layout";
import Pokedex, { loader as pokedexLoader } from "../pages/Pokedex";
import Pokemon from "../pages/Pokemon";
import Teams, { loader as teamsLoader } from "../pages/Teams";

const dataRoute = (
    id: string,
    path: string,
    element: React.ReactElement,
    loader: RouteObject["loader"],
    errorMessage: string
): RouteObject => ({
    id,
    path,
    element,
    loader,
    errorElement: <div>{errorMessage}</div>,
    HydrateFallback: LoadingSpinner,
});

export const createAppRouter = (queryClient: QueryClient) => {
    const pokedexError =
        "There was an error loading the Pokédex. Please try again.";

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
                    <Pokedex />,
                    pokedexLoader(queryClient),
                    pokedexError
                ),
                dataRoute(
                    "pokemon",
                    "/pokedex/:pokemon",
                    <Pokemon />,
                    pokedexLoader(queryClient),
                    pokedexError
                ),
                dataRoute(
                    "teams",
                    "/teams",
                    <Teams />,
                    teamsLoader(queryClient),
                    "There was an error loading teams. Please try again."
                ),
            ],
        },
    ]);
};
