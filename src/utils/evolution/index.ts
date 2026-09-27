import {
    EvolutionLane,
    EvolutionMethod,
    EvolutionStep,
    PokemonDetails,
    PokemonForm,
    RegionalForm,
} from "@customTypes/PokemonTypes";

const REGIONS: { form: RegionalForm; generationId: number }[] = [
    { form: "alola", generationId: 7 },
    { form: "galar", generationId: 8 },
    { form: "hisui", generationId: 8 },
    { form: "paldea", generationId: 9 },
];

const titleCase = (value: string) =>
    value
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export const getPokemonForm = (
    name: string,
    isDefault: boolean
): PokemonForm => {
    if (isDefault) {
        return null;
    }
    const parts = name.split("-");
    if (parts.includes("mega")) {
        return "mega";
    }
    if (parts.includes("gmax")) {
        return "gmax";
    }
    // regional forms end in the region ("meowth-alola"); "pikachu-alola-cap"
    // is a costume, not a variant
    const last = parts[parts.length - 1];
    return REGIONS.find(({ form }) => form === last)?.form ?? "other";
};

/** Short label for how one PokeAPI evolution row is triggered. */
export const formatEvolutionMethod = (method: EvolutionMethod): string => {
    const trigger = method.trigger?.name ?? "level-up";
    const held = method.held ? ` holding ${titleCase(method.held.name)}` : "";
    const time = method.time_of_day ? ` (${method.time_of_day})` : "";

    if (trigger === "use-item") {
        return `Use ${method.item ? titleCase(method.item.name) : "item"}`;
    }
    if (trigger === "trade") {
        return `Trade${held}`;
    }
    if (trigger !== "level-up") {
        return titleCase(trigger);
    }
    if (method.min_level) {
        return `Lv. ${method.min_level}${held}${time}`;
    }
    if (method.min_happiness) {
        return `High friendship${held}${time}`;
    }
    if (method.move) {
        return `Knows ${titleCase(method.move.name)}`;
    }
    if (method.location) {
        return `Level up at ${titleCase(method.location.name)}`;
    }
    return `Level up${held}${time}`;
};

type Species = {
    id: number;
    parentId: number;
    base: PokemonDetails;
    regional: Map<RegionalForm, PokemonDetails>;
    extras: PokemonDetails[];
};

const groupBySpecies = (chain: PokemonDetails[]) => {
    const species = new Map<number, Species>();
    for (const item of chain) {
        let entry = species.get(item.speciesId);
        if (!entry) {
            entry = {
                id: item.speciesId,
                parentId: item.evolvesFromId,
                base: item,
                regional: new Map(),
                extras: [],
            };
            species.set(item.speciesId, entry);
        }
        if (item.isDefault) {
            entry.base = item;
        } else if (item.form === "mega" || item.form === "gmax") {
            entry.extras.push(item);
        } else if (item.form && item.form !== "other") {
            entry.regional.set(item.form, item);
        }
    }
    return species;
};

/**
 * Splits an evolution chain into lanes of ordered stages, e.g.
 * Gastly -> Haunter -> Gengar, with Gengar-Mega/-Gmax listed as `forms` of the
 * Gengar step. Species with regional variants add one lane per region.
 *
 * PokeAPI records evolutions per species, not per form, so a species whose
 * parent has a regional form and which debuted in that region's generation
 * (Perrserker after Galarian Meowth) is assigned to that region's lane. Where
 * a species has several evolution rows, lane N uses row N (Persian: row 0 is
 * Kanto, row 1 is Alola), falling back to the first row.
 */
export const buildEvolutionLanes = (
    chain: PokemonDetails[]
): EvolutionLane[] => {
    const species = groupBySpecies(chain);

    const depthOf = (entry: Species, seen = new Set<number>()): number => {
        const parent = species.get(entry.parentId);
        if (!parent || seen.has(entry.id)) {
            return 0;
        }
        seen.add(entry.id);
        return depthOf(parent, seen) + 1;
    };

    // region -> species that only exist in that region's lane
    const regionOf = (entry: Species): RegionalForm | null => {
        const parent = species.get(entry.parentId);
        if (!parent || entry.regional.size > 0) {
            return null;
        }
        // the latest matching region wins (Perrserker: Galar, not Alola)
        const region = REGIONS.filter(
            ({ form, generationId }) =>
                parent.regional.has(form) &&
                entry.base.generationId >= generationId &&
                entry.base.generationId > parent.base.generationId
        ).sort((a, b) => b.generationId - a.generationId)[0];
        return region?.form ?? null;
    };

    const laneMembers = (region: RegionalForm | null) => {
        const members = new Map<number, PokemonDetails>();
        for (const entry of species.values()) {
            const owner = regionOf(entry);
            if (region === null) {
                // the first-listed default form of each species
                if (owner === null && !isRegionalOnly(entry)) {
                    members.set(entry.id, entry.base);
                }
            } else if (entry.regional.has(region) || owner === region) {
                members.set(entry.id, entry.regional.get(region) ?? entry.base);
            }
        }
        if (region !== null) {
            // keep ancestors so the lane reads from the first stage
            for (const id of [...members.keys()]) {
                let parent = species.get(species.get(id)?.parentId ?? 0);
                while (parent && !members.has(parent.id)) {
                    members.set(
                        parent.id,
                        parent.regional.get(region) ?? parent.base
                    );
                    parent = species.get(parent.parentId);
                }
            }
        }
        return members;
    };

    const isRegionalOnly = (entry: Species) =>
        entry.base.form !== null && entry.base.form !== "other";

    const regions = REGIONS.map(({ form }) => form).filter((form) =>
        [...species.values()].some(
            (entry) => entry.regional.has(form) || regionOf(entry) === form
        )
    );

    return [null, ...regions].map((region, laneIndex) => {
        const stages: EvolutionStep[][] = [];
        for (const [id, pokemon] of laneMembers(region)) {
            const entry = species.get(id) as Species;
            const depth = depthOf(entry);
            const methods = pokemon.evolutionMethods;
            const step: EvolutionStep = {
                pokemon,
                method:
                    depth === 0
                        ? null
                        : (methods[laneIndex] ?? methods[0] ?? null),
                forms:
                    region === null
                        ? [...entry.extras].sort((a, b) => a.id - b.id)
                        : [],
            };
            (stages[depth] ??= []).push(step);
        }
        return {
            region,
            stages: stages
                .filter(Boolean)
                .map((stage) =>
                    stage.sort((a, b) => a.pokemon.id - b.pokemon.id)
                ),
        };
    });
};
