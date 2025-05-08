import { Pokemon } from "@customTypes/PokemonTypes";

export const getPokemonGridProps = ({
    width,
    pokemon = [],
    cardWidth = 210,
    isPlacehodler = false,
}: {
    width: number;
    pokemon?: Pokemon[];
    cardWidth?: number;
    isPlacehodler?: boolean;
}) => {
    const columnCount = Math.floor(width / cardWidth) || 1;
    const columnWidth = width / columnCount;
    const rowHeight = columnWidth * 1.6;
    const itemCount = isPlacehodler
        ? 36
        : pokemon.length
          ? pokemon.length
          : columnCount ** columnCount;
    const rowCount = Math.ceil(itemCount / columnCount);
    const gridGap = 10;
    const overscanRowCount = 1; // Math.round(columnCount / 3);

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
