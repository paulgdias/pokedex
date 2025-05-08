import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import { Grid, AutoSizer } from "react-virtualized";

import { Pokemon } from "@customTypes/PokemonTypes";
import PokemonCard from "@components/PokemonCard";

import { Button } from "react-aria-components";
import { ArrowUp } from "lucide-react";

import { twMerge } from "tailwind-merge";

import { getPokemonGridProps } from "./utils";

import "react-virtualized/styles.css";
import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";

const PokemonList = ({
    className,
    scrollToPosition = true,
    pokemon,
    isLoading = false,
    previous,
}: {
    className?: string;
    scrollToPosition?: boolean;
    pokemon: Pokemon[];
    isLoading?: boolean;
    previous?: string;
}) => {
    const grid = useRef<Grid | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (grid.current) {
            grid.current.scrollToPosition({
                scrollLeft: 0,
                scrollTop: 0,
            });
        }
    }, [grid, pokemon]);

    if (!isLoading && pokemon.length === 0) {
        return <div className="flex justify-center mt-[50dvh]">No Results</div>;
    }

    return (
        <div className={twMerge("flex h-[95dvh]", className)}>
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
                            cellRenderer={({
                                key,
                                columnIndex,
                                rowIndex,
                                style,
                            }) => {
                                if (isLoading) {
                                    return (
                                        <PlaceholderCard
                                            key={key}
                                            style={{
                                                ...style,
                                                height: rowHeight - gridGap,
                                                width: columnWidth - gridGap,
                                            }}
                                        />
                                    );
                                }

                                const index =
                                    itemCount < columnCount
                                        ? columnIndex
                                        : columnIndex + rowIndex * columnCount;

                                if (index >= pokemon.length) {
                                    return null;
                                }

                                const {
                                    is_legendary: isLegendary,
                                    is_mythical: isMythical,
                                } = pokemon[index].specs;

                                return (
                                    <PokemonCard
                                        key={key}
                                        style={{
                                            ...style,
                                            height: rowHeight - gridGap,
                                            width: columnWidth - gridGap,
                                        }}
                                        className="hover:border-sky-500 focus:border-sky-500"
                                        pokemon={pokemon[index]}
                                        isLegendary={isLegendary}
                                        isMythical={isMythical}
                                        navigateCallback={(event, pokemon) => {
                                            navigate(
                                                `/pokedex/${pokemon.name}`,
                                                {
                                                    state: {
                                                        pokemon: pokemon,
                                                        previous:
                                                            previous ||
                                                            location.pathname +
                                                                location.search,
                                                    },
                                                }
                                            );
                                        }}
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
                        />
                    );
                }}
            </AutoSizer>

            {scrollToPosition && (
                <Button
                    aria-label="Go to Top of Page"
                    className="fixed rounded-full bottom-0 right-0 m-4 cursor-pointer bg-gray-700 hover:drop-shadow-md hover:drop-shadow-sky-400 transition-transform duration-300 ease-out transform hover:scale-105"
                    onPress={() => {
                        if (grid.current) {
                            grid.current.scrollToPosition({
                                scrollLeft: 0,
                                scrollTop: 0,
                            });
                        }
                    }}
                >
                    <ArrowUp color="white" size={42} />
                </Button>
            )}
        </div>
    );
};

export default PokemonList;
