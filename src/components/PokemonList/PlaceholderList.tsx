import { CSSProperties, useRef } from "react";

import { Grid, AutoSizer } from "react-virtualized";

import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";

import { twMerge } from "tailwind-merge";

import { getPokemonGridProps } from "./utils";

import "react-virtualized/styles.css";

const PlaceholderList = ({
    className,
    style,
    animated = false,
}: {
    className?: string;
    style?: CSSProperties;
    animated?: boolean;
}) => {
    const grid = useRef<Grid | null>(null);

    return (
        <div
            className={twMerge("-mr-4 flex min-h-0 flex-1", className)}
            style={style}
        >
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
                        width: width,
                        isPlacehodler: true,
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
                                const index =
                                    itemCount < columnCount
                                        ? columnIndex
                                        : columnIndex + rowIndex * columnCount;

                                if (index >= itemCount) {
                                    return null;
                                }

                                return (
                                    <PlaceholderCard
                                        key={key}
                                        style={{
                                            ...style,
                                            height: rowHeight - gridGap,
                                            width: columnWidth - gridGap,
                                        }}
                                        animated={animated}
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
        </div>
    );
};

export default PlaceholderList;
