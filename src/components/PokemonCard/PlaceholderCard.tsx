import { useInView } from "react-intersection-observer";

import {
    cardClass,
    imgClass,
    cardStatsClass,
    pokedexIdClass,
    placeholderWithBlurClass,
    placeholderImg
} from "@styles/Pokedex";

const PlaceholderCard = () => {
	const { ref, inView } = useInView({
		threshold: 0,
		triggerOnce: true,
	});

	return (
		<div ref={ref}>
			{inView ? (
				<div className={`${cardClass} animate-pulse`}>
					<img title="Placeholder Card" alt="Placeholder Card" className={`${imgClass} blur-sm`} src={placeholderImg} />
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
			) : null}
		</div>
	);
};

export default PlaceholderCard;