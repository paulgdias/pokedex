import { CSSProperties, ReactNode, Ref } from "react";
import { PokemonDetails } from "./PokemonTypes";

export interface PokemonCardType {
    ref?: Ref<HTMLDivElement>;
    className?: string;
    style?: CSSProperties;
    pokemon: PokemonDetails;
    /** shown instead of `pokemon.sprite` */
    sprite?: string;
    /** render `sprite` as pixel art (crisp, at a whole-number scale) */
    pixelated?: boolean;
    /** overlay content inside the art area (e.g. a toggle) */
    children?: ReactNode;
    isLegendary?: boolean;
    isMythical?: boolean;
    size?: "default" | "large";
    navigateCallback?: (
        event: React.SyntheticEvent,
        pokemon: PokemonCardType["pokemon"],
        evolutions?: Record<number, PokemonDetails[]>
    ) => void;
}
