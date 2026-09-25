import { CSSProperties } from "react";

import { twMerge } from "tailwind-merge";

import { cardArtClass, cardBodyClass, cardClass } from "@styles/Pokedex";

const PlaceholderCard = ({
    className,
    style,
    animated = false,
}: {
    className?: string;
    style?: CSSProperties;
    animated?: boolean;
}) => {
    return (
        <div
            aria-hidden="true"
            className={twMerge(
                cardClass,
                "hover:translate-y-0 hover:shadow-none",
                animated && "animate-pulse",
                className
            )}
            style={style}
        >
            <div className={`${cardArtClass} h-[150px]`} />
            <div className={cardBodyClass}>
                <div className="h-5 w-2/3 rounded bg-track" />
                <div className="h-6 w-20 rounded-full bg-chip" />
            </div>
        </div>
    );
};

export default PlaceholderCard;
