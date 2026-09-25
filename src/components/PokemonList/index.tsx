import { useEffect, useRef } from "react";

import { Grid, AutoSizer } from "react-virtualized";

import { PokemonDetails } from "@customTypes/PokemonTypes";
import PokemonCard from "@components/PokemonCard";
import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";
import ScrollTopButton from "@components/Buttons/ScrollTopButton";

import { twMerge } from "tailwind-merge";

import { useNavigateToPokemon } from "@utils/useNavigateToPokemon";

import { getPokemonGridProps } from "./utils";

import "react-virtualized/styles.css";

const PokemonList = ({
    className,
    scrollToPosition = true,
    pokemon,
    isLoading = false,
    previous,
}: {
    className?: string;
    scrollToPosition?: boolean;
    pokemon: PokemonDetails[];
    isLoading?: boolean;
    previous?: string;
}) => {
    const grid = useRef<Grid | null>(null);
    const navigateToPokemon = useNavigateToPokemon(previous);

    useEffect(() => {
        if (grid.current) {
            grid.current.scrollToPosition({
                scrollLeft: 0,
                scrollTop: 0,
            });
        }
    }, [grid, pokemon]);

    if (!isLoading && pokemon.length === 0) {
        return null;
    }

    return (
        // pulled into the parent's right padding to absorb the trailing grid gap
        <div className={twMerge("-mr-4 flex min-h-0 flex-1", className)}>
            <AutoSizer>
                {({ height, width }) => {
                    const {
                        columnCount,
                        columnWidth,
                        rowHeight,
                        itemCount,
                        rowCount,
                        gridGap,
                        overscanRowCount,
                    } = getPokemonGridProps({
                        pokemon: pokemon,
                        width: width,
                    });

                    return (
                        <Grid
                            ref={grid}
                            className="pokedex-scroll"
                            cellRenderer={({
                                key,
                                columnIndex,
                                rowIndex,
                                style,
                            }) => {
                                const cellStyle = {
                                    ...style,
                                    height: rowHeight - gridGap,
                                    width: columnWidth - gridGap,
                                };

                                if (isLoading) {
                                    return (
                                        <PlaceholderCard
                                            key={key}
                                            style={cellStyle}
                                        />
                                    );
                                }

                                const index =
                                    columnIndex + rowIndex * columnCount;

                                if (index >= pokemon.length) {
                                    return null;
                                }

                                const { isLegendary, isMythical } =
                                    pokemon[index];

                                return (
                                    <PokemonCard
                                        key={key}
                                        style={cellStyle}
                                        className="hover:border-line-strong"
                                        pokemon={pokemon[index]}
                                        isLegendary={isLegendary}
                                        isMythical={isMythical}
                                        navigateCallback={navigateToPokemon}
                                    />
                                );
                            }}
                            height={height}
                            rowHeight={rowHeight}
                            rowCount={rowCount}
                            columnCount={
                                itemCount < columnCount
                                    ? itemCount
                                    : columnCount
                            }
                            width={width}
                            columnWidth={columnWidth}
                            tabIndex={-1}
                            overscanRowCount={overscanRowCount}
                            style={{ overflowX: "hidden", outline: "none" }}
                        />
                    );
                }}
            </AutoSizer>

            {scrollToPosition && (
                <ScrollTopButton
                    onPress={() => {
                        if (grid.current) {
                            grid.current.scrollToPosition({
                                scrollLeft: 0,
                                scrollTop: 0,
                            });
                        }
                    }}
                />
            )}
        </div>
    );
};

export default PokemonList;
