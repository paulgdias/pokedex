import { describe, expect, it } from "vitest";

import allowed from "../../api/src/allowedQueries.json";
import { efficacyQuery, infoQuery, pokedexQuery } from "./pokedex";

// the proxy forwards only these documents (api/src/pokeapiProxy.js), compared
// with whitespace collapsed; editing a query in pokedex.ts without updating
// api/src/allowedQueries.json would make the proxy answer 400 to the app
const normalize = (query: string) => query.replace(/\s+/g, " ").trim();

describe("api/src/allowedQueries.json", () => {
    it("holds exactly the queries the app sends, whitespace-collapsed", () => {
        expect(allowed).toEqual({
            getPokedex: normalize(pokedexQuery),
            getPokemonInfo: normalize(infoQuery),
            getTypeEfficacy: normalize(efficacyQuery),
        });
    });
});
