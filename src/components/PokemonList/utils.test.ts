import { describe, expect, it } from "vitest";

import { makeDex } from "../__fixtures__/pokemon";
import { getPokemonGridProps } from "./utils";

describe("getPokemonGridProps", () => {
    it("fits as many 200px cards as the width allows, counting the 20px gap", () => {
        // 3 * (200 + 20) = 660
        expect(getPokemonGridProps({ width: 659 }).columnCount).toBe(2);
        expect(getPokemonGridProps({ width: 660 }).columnCount).toBe(3);
        expect(getPokemonGridProps({ width: 900 }).columnCount).toBe(4);
    });

    it("caps the grid at five columns however wide it gets", () => {
        // 5 * (200 + 20) = 1100; a sixth column would fit at 1320
        expect(getPokemonGridProps({ width: 1100 }).columnCount).toBe(5);
        expect(getPokemonGridProps({ width: 1320 }).columnCount).toBe(5);
        expect(getPokemonGridProps({ width: 2400 }).columnCount).toBe(5);
    });

    it("never has fewer than one column", () => {
        expect(getPokemonGridProps({ width: 0 }).columnCount).toBe(1);
        expect(getPokemonGridProps({ width: 100 }).columnCount).toBe(1);
    });

    it("splits the width evenly between the columns", () => {
        const { columnCount, columnWidth } = getPokemonGridProps({
            width: 900,
        });
        expect(columnCount).toBe(4);
        expect(columnWidth).toBe(225);
    });

    it("has a fixed row height of card height plus gap", () => {
        const { rowHeight, gridGap } = getPokemonGridProps({ width: 900 });
        expect(gridGap).toBe(20);
        expect(rowHeight).toBe(288);
    });

    it("rounds the row count up", () => {
        const props = getPokemonGridProps({
            width: 660,
            pokemon: makeDex(7),
        });
        expect(props.itemCount).toBe(7);
        expect(props.rowCount).toBe(3);
    });

    it("has no rows without pokémon", () => {
        const props = getPokemonGridProps({ width: 660 });
        expect(props.itemCount).toBe(0);
        expect(props.rowCount).toBe(0);
    });

    it("uses 36 placeholder items while loading, whatever the list", () => {
        const props = getPokemonGridProps({
            width: 660,
            pokemon: makeDex(2),
            isPlaceholder: true,
        });
        expect(props.itemCount).toBe(36);
        expect(props.rowCount).toBe(12);
    });

    it("overscans two rows", () => {
        expect(getPokemonGridProps({ width: 900 }).overscanRowCount).toBe(2);
    });
});
