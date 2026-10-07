import {
    PokemonDetails,
    PokemonInfo,
    TypeEfficacy,
} from "@customTypes/PokemonTypes";

import pikachu from "./pikachu.png?inline";
import pikachuPixelated from "./pikachu-pixelated.png?inline";

/** Pikachu's artwork inlined as a data URI, so no test or story requests the network. */
export const sprite = () => pikachu;

/** A pixel-art sprite, for the `pixelated` card. */
export const PIXELATED_SPRITE = pikachuPixelated;

/** The default artwork / in-game sprite of `makePokemon`. */
export const SPRITE = sprite();

export const makePokemon = (
    overrides: Partial<PokemonDetails> = {}
): PokemonDetails => {
    const id = overrides.id ?? 1;
    return {
        id,
        name: "bulbasaur",
        sprite: SPRITE,
        inGameSprite: sprite(),
        types: ["grass", "poison"],
        isLegendary: false,
        isMythical: false,
        generationId: 1,
        evolutionChainId: id,
        speciesId: id,
        evolvesFromId: 0,
        isDefault: true,
        form: null,
        stats: [45, 49, 49, 65, 65, 45],
        statTotal: 318,
        evolutionMethods: [],
        evolutions: [],
        ...overrides,
    };
};

/** Gives every member the whole chain, as `withEvolutions` does. */
export const chain = (members: PokemonDetails[]) =>
    members.map((member) => ({ ...member, evolutions: members }));

const BULBASAUR = makePokemon({ evolutionChainId: 1 });
const IVYSAUR = makePokemon({
    id: 2,
    name: "ivysaur",
    evolutionChainId: 1,
    speciesId: 2,
    evolvesFromId: 1,
    evolutionMethods: ["Lv. 16"],
    stats: [60, 62, 63, 80, 80, 60],
    statTotal: 405,
});
const VENUSAUR = makePokemon({
    id: 3,
    name: "venusaur",
    evolutionChainId: 1,
    speciesId: 3,
    evolvesFromId: 2,
    evolutionMethods: ["Lv. 32"],
    stats: [80, 82, 83, 100, 100, 80],
    statTotal: 525,
});
const VENUSAUR_MEGA = makePokemon({
    id: 10033,
    name: "venusaur-mega",
    evolutionChainId: 1,
    speciesId: 3,
    evolvesFromId: 2,
    isDefault: false,
    form: "mega",
    stats: [80, 100, 123, 122, 120, 80],
    statTotal: 625,
});
const VENUSAUR_GMAX = makePokemon({
    id: 10195,
    name: "venusaur-gmax",
    evolutionChainId: 1,
    speciesId: 3,
    evolvesFromId: 2,
    isDefault: false,
    form: "gmax",
});

/** A three-stage line; Venusaur has a Mega and a Gigantamax form. */
export const BULBASAUR_LINE = chain([
    BULBASAUR,
    IVYSAUR,
    VENUSAUR,
    VENUSAUR_MEGA,
    VENUSAUR_GMAX,
]);
export const [bulbasaur, ivysaur, venusaur, venusaurMega, venusaurGmax] =
    BULBASAUR_LINE;

/** A single-stage species: no evolution section. */
export const DITTO = makePokemon({
    id: 132,
    name: "ditto",
    types: ["normal"],
    stats: [48, 48, 48, 48, 48, 48],
    statTotal: 288,
});

const EEVEE_CHAIN = 133;
export const EEVEE_LINE = chain([
    makePokemon({
        id: 133,
        name: "eevee",
        types: ["normal"],
        evolutionChainId: EEVEE_CHAIN,
    }),
    makePokemon({
        id: 134,
        name: "vaporeon",
        types: ["water"],
        evolutionChainId: EEVEE_CHAIN,
        evolvesFromId: 133,
        evolutionMethods: ["Use Water Stone"],
    }),
    makePokemon({
        id: 135,
        name: "jolteon",
        types: ["electric"],
        evolutionChainId: EEVEE_CHAIN,
        evolvesFromId: 133,
        evolutionMethods: ["Use Thunder Stone"],
    }),
]);

/** Meowth: a Kanto line, an Alola line, and Galar's Perrserker. */
const MEOWTH_CHAIN = 52;
export const MEOWTH_LINE = chain([
    makePokemon({
        id: 52,
        name: "meowth",
        types: ["normal"],
        evolutionChainId: MEOWTH_CHAIN,
    }),
    makePokemon({
        id: 10107,
        name: "meowth-alola",
        types: ["dark"],
        evolutionChainId: MEOWTH_CHAIN,
        speciesId: 52,
        isDefault: false,
        form: "alola",
    }),
    makePokemon({
        id: 10161,
        name: "meowth-galar",
        types: ["steel"],
        evolutionChainId: MEOWTH_CHAIN,
        speciesId: 52,
        isDefault: false,
        form: "galar",
    }),
    makePokemon({
        id: 53,
        name: "persian",
        types: ["normal"],
        evolutionChainId: MEOWTH_CHAIN,
        evolvesFromId: 52,
        evolutionMethods: ["Lv. 28", "High friendship"],
        generationId: 1,
    }),
    makePokemon({
        id: 10108,
        name: "persian-alola",
        types: ["dark"],
        evolutionChainId: MEOWTH_CHAIN,
        speciesId: 53,
        evolvesFromId: 52,
        evolutionMethods: ["Lv. 28", "High friendship"],
        isDefault: false,
        form: "alola",
    }),
    makePokemon({
        id: 863,
        name: "perrserker",
        types: ["steel"],
        evolutionChainId: MEOWTH_CHAIN,
        evolvesFromId: 52,
        evolutionMethods: ["Lv. 28"],
        generationId: 8,
    }),
]);

export const MEWTWO = makePokemon({
    id: 150,
    name: "mewtwo",
    types: ["psychic"],
    isLegendary: true,
    stats: [106, 110, 90, 154, 90, 130],
    statTotal: 680,
});
export const MEW = makePokemon({
    id: 151,
    name: "mew",
    types: ["psychic"],
    isMythical: true,
    stats: [100, 100, 100, 100, 100, 100],
    statTotal: 600,
});
export const CHARMANDER = makePokemon({
    id: 4,
    name: "charmander",
    types: ["fire"],
    stats: [39, 52, 43, 60, 50, 65],
    statTotal: 309,
});
export const SQUIRTLE = makePokemon({
    id: 7,
    name: "squirtle",
    types: ["water"],
    stats: [44, 48, 65, 50, 64, 43],
    statTotal: 314,
});
export const PICHU = makePokemon({
    id: 172,
    name: "pichu",
    types: ["electric"],
    generationId: 2,
    stats: [20, 40, 15, 35, 35, 60],
    statTotal: 205,
});
/** A pokémon without artwork or an in-game sprite. */
export const MISSINGNO = makePokemon({
    id: 999,
    name: "missingno",
    sprite: "",
    inGameSprite: null,
    types: ["normal"],
    generationId: 3,
});

/** A small dex spanning types, generations and both special categories. */
export const DEX: PokemonDetails[] = [
    bulbasaur,
    ivysaur,
    venusaur,
    CHARMANDER,
    SQUIRTLE,
    DITTO,
    MEWTWO,
    MEW,
    PICHU,
    MISSINGNO,
];

/** `count` distinct pokémon, for exercising the virtualized list. */
export const makeDex = (count: number): PokemonDetails[] =>
    Array.from({ length: count }, (_, index) =>
        makePokemon({
            id: index + 1,
            name: `mon-${index + 1}`,
            types: index % 2 ? ["water"] : ["fire", "flying"],
            generationId: (index % 9) + 1,
        })
    );

export const makeInfo = (
    overrides: Partial<PokemonInfo> = {}
): PokemonInfo => ({
    height: 7,
    weight: 69,
    baseExperience: 64,
    abilities: [
        {
            name: "overgrow",
            isHidden: false,
            effect: "Powers up Grass moves in a pinch.",
        },
        {
            name: "chlorophyll",
            isHidden: true,
            effect: "Boosts Speed in sunshine.",
        },
    ],
    cry: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
    genus: "Seed Pokémon",
    genderRate: 1,
    captureRate: 45,
    baseHappiness: 50,
    hatchCounter: 20,
    habitat: "grassland",
    color: "green",
    shape: "quadruped",
    growthRate: "medium-slow",
    eggGroups: ["monster", "plant"],
    flavorTexts: [
        {
            text: "A strange seed was\nplanted on its\nback at birth.",
            version: "sword",
        },
        { text: "It can go without\neating for days.", version: "ruby" },
    ],
    ...overrides,
});

/** attacker -> defender -> multiplier; anything missing is neutral. */
export const EFFICACY: TypeEfficacy = {
    normal: { ghost: 0 },
    fire: { grass: 2, water: 0.5, fire: 0.5, ice: 2 },
    water: { fire: 2, grass: 0.5, water: 0.5 },
    grass: { water: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5 },
    electric: { water: 2, flying: 2, ground: 0, grass: 0.5 },
    ice: { grass: 2, flying: 2, fire: 0.5, ice: 0.5 },
    ground: { electric: 2, fire: 2, grass: 0.5, flying: 0 },
};
