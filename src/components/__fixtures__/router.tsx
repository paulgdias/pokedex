import { createContext, ReactNode, useContext, useState } from "react";
import {
    createMemoryRouter,
    RouterProvider,
    useLocation,
    useNavigate,
} from "react-router";

import { PokemonDetails } from "@customTypes/PokemonTypes";

const Page = createContext<ReactNode>(null);

/** Publishes the current location so tests can assert on navigation. */
export const LocationProbe = () => {
    const { pathname, search, state } = useLocation();
    return (
        <div
            hidden
            data-testid="location"
            data-pathname={pathname}
            data-search={search}
            data-previous={(state as { previous?: string } | null)?.previous}
            data-pokemon={
                (state as { pokemon?: PokemonDetails } | null)?.pokemon?.name
            }
        />
    );
};

/** A button that navigates, for exercising location-driven components. */
export const GoTo = ({ to, label }: { to: string; label: string }) => {
    const navigate = useNavigate();
    return (
        <button type="button" onClick={() => navigate(to)}>
            {label}
        </button>
    );
};

const Content = () => (
    <>
        {useContext(Page)}
        <LocationProbe />
    </>
);

/**
 * A memory data router around `children`. With `dex`, the `"pokedex"` and
 * `"pokemon"` routes load it, like the app's routes do for `Nav`.
 */
const TestRouter = ({
    children,
    initialEntries = ["/"],
    dex,
}: {
    children: ReactNode;
    initialEntries?: string[];
    dex?: PokemonDetails[];
}) => {
    const [router] = useState(() =>
        createMemoryRouter(
            [
                ...(dex
                    ? [
                          {
                              id: "pokedex",
                              path: "/pokedex",
                              loader: () => dex,
                              element: <Content />,
                          },
                          {
                              id: "pokemon",
                              path: "/pokedex/:pokemon",
                              loader: () => dex,
                              element: <Content />,
                          },
                      ]
                    : []),
                { path: "*", element: <Content /> },
            ],
            { initialEntries }
        )
    );

    return (
        <Page.Provider value={children}>
            <RouterProvider router={router} />
        </Page.Provider>
    );
};

export default TestRouter;
