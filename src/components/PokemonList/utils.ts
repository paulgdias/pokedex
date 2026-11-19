import { PokemonDetails } from "@customTypes/PokemonTypes";

const GRID_GAP = 20;
/** the narrowest card on which two type pills still fit on one line */
export const MIN_CARD_WIDTH = 230;
const MAX_COLUMNS = 5;
/** a default PokemonCard's height, border included; the grid row is this plus the gap */
export const CARD_HEIGHT = 268;

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
    const columnCount =
        Math.min(Math.floor(width / (MIN_CARD_WIDTH + gridGap)), MAX_COLUMNS) ||
        1;
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
