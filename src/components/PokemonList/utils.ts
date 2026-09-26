import { PokemonDetails } from "@customTypes/PokemonTypes";

const GRID_GAP = 16;
const MIN_CARD_WIDTH = 190;
const CARD_HEIGHT = 232;

/**
 * `width` includes one trailing gap (the list is pulled into its parent's
 * padding by the gap), so each card is `columnWidth - gap` wide.
 */
export const getPokemonGridProps = ({
    width,
    pokemon = [],
    isPlaceholder = false,
}: {
    width: number;
    pokemon?: PokemonDetails[];
    isPlaceholder?: boolean;
}) => {
    const gridGap = GRID_GAP;
    const columnCount = Math.floor(width / (MIN_CARD_WIDTH + gridGap)) || 1;
    const columnWidth = width / columnCount;
    const rowHeight = CARD_HEIGHT + gridGap;
    const itemCount = isPlaceholder ? 36 : pokemon.length;
    const rowCount = Math.ceil(itemCount / columnCount);
    const overscanRowCount = 2;

    return {
        columnCount,
        columnWidth,
        rowHeight,
        itemCount,
        rowCount,
        gridGap,
        overscanRowCount,
    };
};
