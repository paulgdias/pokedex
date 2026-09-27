import { QueryClient } from "@tanstack/react-query";
import type { RouteObject } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { pokedexQueryOptions } from "@api/pokedex";

import { createAppRouter } from ".";

// the router stores `HydrateFallback` as `hydrateFallbackElement`
type Route = RouteObject & { hydrateFallbackElement?: unknown };

const routes = () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(pokedexQueryOptions.queryKey, {
        pokemon: [
            {
                id: 1,
                name: "bulbasaur",
                is_default: true,
                sprites: [],
                types: [],
                stats: [],
                specs: {
                    species_id: 1,
                    evolution_methods: [],
                    is_legendary: false,
                    is_mythical: false,
                    generation_id: 1,
                    evolution_chain_id: 1,
                    evolves_from_species_id: 0,
                },
            },
        ],
    });
    const router = createAppRouter(queryClient);
    const [root] = router.routes as unknown as Route[];
    return {
        router,
        queryClient,
        root,
        children: root.children as Route[],
    };
};

const child = (children: Route[], path: string | undefined) =>
    children.find((route) => route.path === path) as Route;

let disposable: { dispose: () => void } | undefined;
afterEach(() => {
    disposable?.dispose();
});

describe("createAppRouter", () => {
    it("nests every page under the layout at /", () => {
        const { router, root, children } = routes();
        disposable = router;
        expect(root.path).toBe("/");
        expect(root.element).toBeTruthy();
        expect(children.map(({ path }) => path)).toEqual([
            undefined,
            "/pokedex",
            "/pokedex/:pokemon",
            "/compare",
            "/types",
            "/teams",
        ]);
    });

    it("keeps Home in the entry chunk as the index route", () => {
        const { router, children } = routes();
        disposable = router;
        expect(children[0].index).toBe(true);
        expect(children[0].element).toBeTruthy();
        expect(children[0].lazy).toBeUndefined();
    });

    it("gives the routes Nav relies on their ids", () => {
        const { router, children } = routes();
        disposable = router;
        expect(child(children, "/pokedex").id).toBe("pokedex");
        expect(child(children, "/pokedex/:pokemon").id).toBe("pokemon");
        expect(child(children, "/compare").id).toBe("compare");
        expect(child(children, "/teams").id).toBe("teams");
    });

    it("shares one loader between the dex routes", () => {
        const { router, children } = routes();
        disposable = router;
        const loader = child(children, "/pokedex").loader;
        expect(loader).toBeTypeOf("function");
        expect(child(children, "/pokedex/:pokemon").loader).toBe(loader);
        expect(child(children, "/compare").loader).toBe(loader);
    });

    it("loads the dex from the cache through that loader", async () => {
        const { router, children } = routes();
        disposable = router;
        const loader = child(children, "/pokedex").loader as (
            args: unknown
        ) => Promise<{ name: string }[]>;

        const dex = await loader({});

        expect(dex.map((p) => p.name)).toEqual(["bulbasaur"]);
    });

    it("needs no data for the type chart", () => {
        const { router, children } = routes();
        disposable = router;
        expect(child(children, "/types").loader).toBeUndefined();
    });

    it("shows a spinner while data routes hydrate and an error message on failure", () => {
        const { router, root, children } = routes();
        disposable = router;
        expect(root.hydrateFallbackElement).toBeTruthy();
        for (const path of ["/pokedex", "/pokedex/:pokemon", "/compare"]) {
            const route = child(children, path);
            expect(route.hydrateFallbackElement).toBeTruthy();
            expect(route.errorElement).toBeTruthy();
        }
    });

    it("splits every page except Home into a lazy chunk", async () => {
        const { router, children } = routes();
        disposable = router;
        for (const path of [
            "/pokedex",
            "/pokedex/:pokemon",
            "/compare",
            "/types",
        ]) {
            const lazy = child(children, path).lazy as () => Promise<{
                Component: unknown;
            }>;
            expect(lazy).toBeTypeOf("function");
            expect((await lazy()).Component).toBeTruthy();
        }
    });

    it("loads the Teams page and its own loader lazily", async () => {
        const { router, children } = routes();
        disposable = router;
        const teams = child(children, "/teams");
        const loaded = await (
            teams.lazy as () => Promise<{
                Component: unknown;
                loader: unknown;
            }>
        )();
        expect(loaded.Component).toBeTruthy();
        expect(loaded.loader).toBeTypeOf("function");
        expect(teams.errorElement).toBeTruthy();
    });
});
