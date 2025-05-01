import { useInView } from "react-intersection-observer";

import {
	cardClass,
	imgClass,
	cardStatsClass,
	pokedexIdClass,
	placeholderWithBlurClass,
	placeholderImg,
} from "@styles/Pokedex";

const PurePlaceholderCard = ({
	animated = false
}: {
	animated?: boolean
}) => {
	return (
		<div className={`${cardClass} ${animated && "animate-pulse"}`}>
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

const PlaceholderCardInView = () => {
	const { ref, inView } = useInView({
		threshold: 0.25,
		triggerOnce: true,
	});

	return (
		<div ref={ref}>
			{inView ? (
				<PurePlaceholderCard animated={false}/>
			) : null}
		</div>
	);
};

export default PlaceholderCardInView;
export {
	PurePlaceholderCard
};
