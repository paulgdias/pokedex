import React, { CSSProperties, useRef } from "react";

import { Grid, AutoSizer } from "react-virtualized";

import PlaceholderCard from "@components/PokemonCard/PlaceholderCard";

import { twMerge } from "tailwind-merge";

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
        <div className={twMerge("flex h-[95dvh]", className)} style={style}>
            <AutoSizer>
                {({ height, width }) => {
                    const cardWidth = 210;
                    const columnCount = Math.floor(width / cardWidth) || 1;
                    const columnWidth = width / columnCount;
                    const rowHeight = columnWidth * 1.6;
                    const itemCount = 36;
                    const rowCount = Math.ceil(itemCount / columnCount);
                    const gridGap = 10;

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
                                        className="hover:border-sky-500 focus:border-sky-500"
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
                            overscanRowCount={columnCount}
                        />
                    );
                }}
            </AutoSizer>
        </div>
    );
};

export default PlaceholderList;
