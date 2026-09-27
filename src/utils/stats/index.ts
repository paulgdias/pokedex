import { TypeEfficacy, typeColors } from "@customTypes/PokemonTypes";

export const STAT_LABELS = [
    "HP",
    "Attack",
    "Defense",
    "Sp. Atk",
    "Sp. Def",
    "Speed",
] as const;

/** Highest base stat in the game (Blissey's HP), used as the bar's full width. */
export const MAX_STAT = 255;

/** "lightning-rod" -> "Lightning Rod" */
export const formatName = (name: string) =>
    name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

/** PokeAPI flavor text is hard-wrapped with newlines and form feeds. */
export const formatFlavorText = (text: string) =>
    text
        .replace(/[\n\f]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/** Height comes in decimetres, weight in hectograms. */
export const formatHeight = (decimetres: number) => {
    const inches = Math.round(decimetres * 3.937);
    return `${(decimetres / 10).toFixed(1)} m (${Math.floor(inches / 12)}′${String(inches % 12).padStart(2, "0")}″)`;
};
export const formatWeight = (hectograms: number) =>
    `${(hectograms / 10).toFixed(1)} kg (${(hectograms * 0.2205).toFixed(1)} lb)`;

/** Share of females, or null when the species is genderless. */
export const getFemaleShare = (genderRate: number) =>
    genderRate < 0 ? null : genderRate / 8;

export type MatchupGroup = {
    multiplier: number;
    label: string;
    types: (keyof typeof typeColors)[];
};

const MATCHUP_LABELS: [number, string][] = [
    [4, "4×"],
    [2, "2×"],
    [0.5, "½×"],
    [0.25, "¼×"],
    [0, "0×"],
];

/**
 * Damage multipliers of every attacking type against a pokémon's types,
 * grouped by multiplier (neutral matchups are left out). Dual types multiply.
 */
export const getTypeMatchups = (
    defenders: string[],
    efficacy: TypeEfficacy
): MatchupGroup[] => {
    const attackers = Object.keys(efficacy) as (keyof typeof typeColors)[];
    const multipliers = attackers.map((attacker) => ({
        attacker,
        multiplier: defenders.reduce(
            (product, defender) =>
                product * (efficacy[attacker]?.[defender] ?? 1),
            1
        ),
    }));

    return MATCHUP_LABELS.map(([multiplier, label]) => ({
        multiplier,
        label,
        types: multipliers
            .filter((entry) => entry.multiplier === multiplier)
            .map((entry) => entry.attacker),
    })).filter((group) => group.types.length > 0);
};

/** The 18 types in the games' order (also the type chart's order). */
export const TYPE_ORDER = [
    "normal",
    "fighting",
    "flying",
    "poison",
    "ground",
    "rock",
    "bug",
    "ghost",
    "steel",
    "fire",
    "water",
    "grass",
    "electric",
    "psychic",
    "ice",
    "dragon",
    "dark",
    "fairy",
] as const satisfies readonly (keyof typeof typeColors)[];

/** Types an attacking type hits for 2×, ½× and 0×. */
export const getOffense = (attacker: string, efficacy: TypeEfficacy) =>
    [2, 0.5, 0].map((multiplier) => ({
        multiplier,
        label: multiplier === 0.5 ? "½×" : `${multiplier}×`,
        types: TYPE_ORDER.filter(
            (defender) => efficacy[attacker]?.[defender] === multiplier
        ),
    }));

const MATCHUP_DESCRIPTIONS: Record<number, string> = {
    4: "4× (double super effective)",
    2: "2× (super effective)",
    1: "1× (neutral)",
    0.5: "½× (not very effective)",
    0.25: "¼× (barely effective)",
    0: "0× (no effect)",
};

/** "Fire → Grass: 2× (super effective)" */
export const describeMatchup = (
    attacker: string,
    defender: string,
    multiplier: number
) =>
    `${formatName(attacker)} → ${formatName(defender)}: ${MATCHUP_DESCRIPTIONS[multiplier] ?? `${multiplier}×`}`;
