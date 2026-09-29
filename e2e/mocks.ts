import type { Page } from "@playwright/test";

// PokeAPI is never contacted: the three GraphQL operations are answered from
// this small dex, and sprites from a 1x1 PNG.

type Mon = {
    id: number;
    name: string;
    types: string[];
    gen: number;
    /** hp, atk, def, spa, spd, spe */
    stats: number[];
    chain: number;
    from?: number;
    legendary?: boolean;
    mythical?: boolean;
};

const mon = (
    id: number,
    name: string,
    types: string[],
    gen: number,
    stats: number[],
    chain: number,
    extra: Partial<Mon> = {}
): Mon => ({ id, name, types, gen, stats, chain, ...extra });

export const DEX: Mon[] = [
    mon(1, "bulbasaur", ["grass", "poison"], 1, [45, 49, 49, 65, 65, 45], 1),
    mon(2, "ivysaur", ["grass", "poison"], 1, [60, 62, 63, 80, 80, 60], 1, {
        from: 1,
    }),
    mon(3, "venusaur", ["grass", "poison"], 1, [80, 82, 83, 100, 100, 80], 1, {
        from: 2,
    }),
    mon(4, "charmander", ["fire"], 1, [39, 52, 43, 60, 50, 65], 2),
    mon(5, "charmeleon", ["fire"], 1, [58, 64, 58, 80, 65, 80], 2, {
        from: 4,
    }),
    mon(6, "charizard", ["fire", "flying"], 1, [78, 84, 78, 109, 85, 100], 2, {
        from: 5,
    }),
    mon(7, "squirtle", ["water"], 1, [44, 48, 65, 50, 64, 43], 3),
    mon(8, "wartortle", ["water"], 1, [59, 63, 80, 65, 80, 58], 3, {
        from: 7,
    }),
    mon(9, "blastoise", ["water"], 1, [79, 83, 100, 85, 105, 78], 3, {
        from: 8,
    }),
    mon(25, "pikachu", ["electric"], 1, [35, 55, 40, 50, 50, 90], 10),
    mon(94, "gengar", ["ghost", "poison"], 1, [60, 65, 60, 130, 75, 110], 20),
    mon(132, "ditto", ["normal"], 1, [48, 48, 48, 48, 48, 48], 30),
    mon(143, "snorlax", ["normal"], 1, [160, 110, 65, 65, 110, 30], 40),
    mon(
        149,
        "dragonite",
        ["dragon", "flying"],
        1,
        [91, 134, 95, 100, 100, 80],
        50
    ),
    mon(150, "mewtwo", ["psychic"], 1, [106, 110, 90, 154, 90, 130], 60, {
        legendary: true,
    }),
    mon(151, "mew", ["psychic"], 1, [100, 100, 100, 100, 100, 100], 70, {
        mythical: true,
    }),
    mon(152, "chikorita", ["grass"], 2, [45, 49, 65, 49, 65, 45], 80),
    mon(155, "cyndaquil", ["fire"], 2, [39, 52, 43, 60, 50, 65], 81),
    mon(158, "totodile", ["water"], 2, [50, 65, 64, 44, 48, 43], 82),
    mon(
        248,
        "tyranitar",
        ["rock", "dark"],
        2,
        [100, 134, 110, 95, 100, 61],
        83
    ),
    mon(252, "treecko", ["grass"], 3, [40, 45, 35, 65, 55, 70], 84),
    mon(
        384,
        "rayquaza",
        ["dragon", "flying"],
        3,
        [105, 150, 90, 150, 90, 95],
        85,
        {
            legendary: true,
        }
    ),
];

export const SPRITE_HOST = "https://raw.githubusercontent.com/";
const GRAPHQL_URL = "https://beta.pokeapi.co/graphql/v1beta";

// a 1x1 transparent PNG
const PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
);

const dexResponse = () => ({
    data: {
        pokemon: DEX.map((m) => ({
            id: m.id,
            name: m.name,
            is_default: true,
            stats: m.stats.map((base_stat, index) => ({
                stat_id: index + 1,
                base_stat,
            })),
            sprites: [
                {
                    pixel: `${SPRITE_HOST}sprite/pixel/${m.id}.png`,
                    default: `${SPRITE_HOST}sprite/art/${m.id}.png`,
                },
            ],
            types: m.types.map((name) => ({ type: { name } })),
            specs: {
                species_id: m.id,
                is_legendary: !!m.legendary,
                is_mythical: !!m.mythical,
                generation_id: m.gen,
                evolution_chain_id: m.chain,
                evolves_from_species_id: m.from ?? 0,
                evolution_methods: m.from
                    ? [
                          {
                              min_level: 16,
                              min_happiness: null,
                              time_of_day: "",
                              trigger: { name: "level-up" },
                              item: null,
                              held: null,
                              move: null,
                              location: null,
                          },
                      ]
                    : [],
            },
        })),
    },
});

const infoResponse = (id: number) => ({
    data: {
        pokemon_v2_pokemon: [
            {
                height: 5 + id,
                weight: 50 + id,
                base_experience: 64,
                abilities: [
                    {
                        is_hidden: false,
                        ability: {
                            name: "overgrow",
                            effects: [{ short_effect: "Powers up moves." }],
                        },
                    },
                ],
                cries: [],
                species: {
                    gender_rate: 1,
                    capture_rate: 45,
                    base_happiness: 50,
                    hatch_counter: 20,
                    habitat: { name: "grassland" },
                    color: { name: "green" },
                    shape: { name: "quadruped" },
                    growth: { name: "medium-slow" },
                    eggGroups: [{ group: { name: "monster" } }],
                    genus: [{ genus: "Seed Pokémon" }],
                    flavor: [
                        {
                            text: "A strange seed was planted on its back.",
                            version: { name: "red" },
                        },
                    ],
                },
            },
        ],
    },
});

// PokeAPI type ids 1-18
const TYPES = [
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
];

// every matchup is neutral except the ones the specs look at
const SPECIAL: Record<string, number> = {
    "fire>grass": 200,
    "fire>water": 50,
    "water>fire": 200,
    "grass>fire": 50,
    "electric>ground": 0,
};

const efficacyResponse = () => ({
    data: {
        types: TYPES.map((name, index) => ({ id: index + 1, name })),
        efficacy: TYPES.flatMap((attacker, a) =>
            TYPES.map((defender, d) => ({
                damage_type_id: a + 1,
                target_type_id: d + 1,
                damage_factor: SPECIAL[`${attacker}>${defender}`] ?? 100,
            }))
        ),
    },
});

export type Requests = {
    /** GraphQL operations seen so far, by operation name */
    count: (operation: string) => number;
    /** ids sent to `getPokemonInfo`, in order */
    infoIds: number[];
};

/**
 * Answers PokeAPI GraphQL and sprite requests from the mock dex. Call before
 * the first `page.goto`. Each test has its own context, so the persisted
 * IndexedDB cache starts empty and the dex request always reaches this mock.
 */
export const mockPokeApi = async (page: Page): Promise<Requests> => {
    const seen = new Map<string, number>();
    const infoIds: number[] = [];

    await page.route(`${SPRITE_HOST}**`, (route) =>
        route.fulfill({ contentType: "image/png", body: PNG })
    );

    await page.route(GRAPHQL_URL, async (route) => {
        const { query, variables } = route.request().postDataJSON() as {
            query: string;
            variables?: { id?: number };
        };
        const operation = /query\s+(\w+)/.exec(query)?.[1] ?? "unknown";
        seen.set(operation, (seen.get(operation) ?? 0) + 1);
        if (operation === "getPokemonInfo") {
            infoIds.push(variables?.id ?? 0);
        }

        const body =
            operation === "getPokedex"
                ? dexResponse()
                : operation === "getPokemonInfo"
                  ? infoResponse(variables?.id ?? 1)
                  : operation === "getTypeEfficacy"
                    ? efficacyResponse()
                    : { errors: [{ message: `unmocked ${operation}` }] };
        await route.fulfill({ json: body });
    });

    // pin the theme so screenshots and contrast are stable
    await page.addInitScript(() => localStorage.setItem("theme", "light"));

    return { count: (operation) => seen.get(operation) ?? 0, infoIds };
};
