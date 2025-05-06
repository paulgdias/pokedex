import { CSSProperties, Ref } from "react";
import { Pokemon } from "./PokemonTypes";

export interface PokemonCardType {
    ref?: Ref<HTMLDivElement>;
    className?: string;
    style?: CSSProperties;
    pokemon: Pokemon;
    isLegendary?: boolean;
    isMythical?: boolean;
    navigateCallback?: (
        event:
            | React.MouseEvent<HTMLDivElement>
            | React.KeyboardEvent<HTMLInputElement>,
        pokemon: PokemonCardType["pokemon"],
        evolutions?: Record<number, Pokemon[]>
    ) => void;
}
