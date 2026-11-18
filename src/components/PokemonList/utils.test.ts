import { describe, expect, it } from "vitest";

import { makeDex } from "../__fixtures__/pokemon";
import { getPokemonGridProps } from "./utils";

describe("getPokemonGridProps", () => {
    it("fits as many 230px cards as the width allows, counting the 20px gap", () => {
        // 3 * (230 + 20) = 750
        expect(getPokemonGridProps({ width: 749 }).columnCount).toBe(2);
        expect(getPokemonGridProps({ width: 750 }).columnCount).toBe(3);
        expect(getPokemonGridProps({ width: 1000 }).columnCount).toBe(4);
    });

    it("caps the grid at five columns however wide it gets", () => {
        // 5 * (230 + 20) = 1250; a sixth column would fit at 1500
        expect(getPokemonGridProps({ width: 1250 }).columnCount).toBe(5);
        expect(getPokemonGridProps({ width: 1500 }).columnCount).toBe(5);
        expect(getPokemonGridProps({ width: 2400 }).columnCount).toBe(5);
    });

    it("never has fewer than one column", () => {
        expect(getPokemonGridProps({ width: 0 }).columnCount).toBe(1);
        expect(getPokemonGridProps({ width: 100 }).columnCount).toBe(1);
    });

    it("splits the width evenly between the columns", () => {
        const { columnCount, columnWidth } = getPokemonGridProps({
            width: 1000,
        });
        expect(columnCount).toBe(4);
        expect(columnWidth).toBe(250);
    });

    it("rounds the row count up", () => {
        const props = getPokemonGridProps({
            width: 750,
            pokemon: makeDex(7),
        });
        expect(props.itemCount).toBe(7);
        expect(props.rowCount).toBe(3);
    });

    it("has no rows without pokémon", () => {
        const props = getPokemonGridProps({ width: 750 });
        expect(props.itemCount).toBe(0);
        expect(props.rowCount).toBe(0);
    });
});
