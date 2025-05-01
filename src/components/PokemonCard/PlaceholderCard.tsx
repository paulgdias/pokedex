import { CSSProperties } from "react";

import { twMerge } from "tailwind-merge";

import {
	cardClass,
	imgClass,
	cardStatsClass,
	pokedexIdClass,
	placeholderWithBlurClass,
	placeholderImg,
} from "@styles/Pokedex";

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
			className={`${twMerge(cardClass, className)} ${animated && "animate-pulse"}`}
			style={style}
		>
			<img
				title="Placeholder Card"
				alt="Placeholder Card"
				className={`${imgClass} blur-sm`}
				src={placeholderImg}
			/>
			<div className="px-6 py-4">
				<div className={`${cardStatsClass} blur-sm`}>
					<div className={`${pokedexIdClass} bg-gray-500`}>{"#"}</div>
					<span className="bg-gray-500">{"pokemon"}</span>
				</div>
			</div>
			<div className="px-2 py-2">
				<span className={`${placeholderWithBlurClass}`}>{"type"}</span>
				<span className={`${placeholderWithBlurClass}`}>{"type"}</span>
				<span className={`${placeholderWithBlurClass}`}>{"type"}</span>
			</div>
		</div>
	);
};

export default PlaceholderCard;
