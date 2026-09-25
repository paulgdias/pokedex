import { CSSProperties, ReactNode, Ref } from "react";
import { PokemonDetails } from "./PokemonTypes";

export interface PokemonCardType {
    ref?: Ref<HTMLDivElement>;
    className?: string;
    style?: CSSProperties;
    pokemon: PokemonDetails;
    /** shown instead of `pokemon.sprite` */
    sprite?: string;
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
