import { PokemonDetails, TypeEfficacy } from "@customTypes/PokemonTypes";
import { getOffense, getTypeMatchups, TYPE_ORDER } from "@utils/stats";

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * One of the 18 types. Everything here lists types in `TYPE_ORDER` from
 * `@utils/stats`, the games' order that the type chart (`/types`) uses too, so
 * both pages list types the same way.
 */
export type PartyType = (typeof TYPE_ORDER)[number];

// ── URL param helpers ────────────────────────────────────────────────────────

/**
 * Deserialises the `party` URL param into exactly 6 slots.
 * Returns 6 nulls if the param is absent or not exactly 6 comma-separated
 * values. `0`, anything but a plain whole number, an unknown id, or a repeat
 * of an id already placed in an earlier slot becomes null, so a Pokémon is
 * never in two slots.
 */
export const parseParty = (
    param: string | null,
    allPokemon: PokemonDetails[]
): (PokemonDetails | null)[] => {
    if (param === null) {
        return Array(6).fill(null);
    }
    const parts = param.split(",");
    if (parts.length !== 6) {
        return Array(6).fill(null);
    }
    const placed = new Set<number>();
    return parts.map((raw) => {
        // digits only: parseInt would read "4abc" or "1.5" as a valid id
        const id = /^\d+$/.test(raw) ? Number(raw) : 0;
        const pokemon = id ? allPokemon.find((p) => p.id === id) : undefined;
        if (!pokemon || placed.has(pokemon.id)) return null;
        placed.add(pokemon.id);
        return pokemon;
    });
};

/** Serialises 6 slots to a comma-separated string; null slots become `0`. */
export const serializeParty = (party: (PokemonDetails | null)[]): string =>
    party.map((p) => (p ? String(p.id) : "0")).join(",");

/**
 * Deserialises the `threats` URL param.
 * Splits on comma, keeps only valid `TYPE_ORDER` names (each once, first
 * occurrence wins), caps at 3.
 */
export const parseThreats = (param: string | null): string[] => {
    if (param === null || param === "") return [];
    const valid = param
        .split(",")
        .filter((t): t is PartyType =>
            (TYPE_ORDER as readonly string[]).includes(t)
        );
    return [...new Set(valid)].slice(0, 3);
};

/** Serialises threat types to a comma-separated string. */
export const serializeThreats = (threats: string[]): string =>
    threats.join(",");

// ── Analysis result types ────────────────────────────────────────────────────

export type DefensiveBand = "immune" | "resistant" | "neutral" | "weak";

export type DefensiveProfileEntry = {
    type: PartyType;
    band: DefensiveBand;
    /** Members taking 2× or more; above zero exactly when the band is weak. */
    weakCount: number;
};

export type CoverageEntry = {
    type: PartyType;
    covered: boolean;
};

export type ThreatGridRow = {
    pokemon: PokemonDetails;
    multipliers: Record<string, number>;
};

export type ReplacementEntry = {
    /** the weakest contributor's slot (0-5) in the six-slot party */
    slotIndex: number;
    currentPokemon: PokemonDetails;
    /** up to 3, best net coverage gain first */
    candidates: PokemonDetails[];
};

// ── Analysis functions ───────────────────────────────────────────────────────

/**
 * Whether the type chart knows every one of `types`, as an attacking type (a
 * row) or a defending type (a column). A type the chart never mentions has no
 * data: its matchups would all read as a misleading 1×.
 */
export const hasTypeData = (types: string[], efficacy: TypeEfficacy) => {
    const known = new Set(Object.keys(efficacy));
    for (const row of Object.values(efficacy)) {
        for (const defender of Object.keys(row)) {
            known.add(defender);
        }
    }
    return types.every((type) => known.has(type));
};

/**
 * For each of the 18 attacking types, derive the band for the whole party.
 * Band priority: Weak > Immune > Resistant > Neutral, so one member's
 * immunity never hides another member's weakness.
 * Returns exactly 18 entries in `TYPE_ORDER` order.
 */
export const computeDefensiveProfile = (
    party: PokemonDetails[],
    efficacy: TypeEfficacy
): DefensiveProfileEntry[] => {
    const matchups = party.map((member) =>
        getTypeMatchups(member.types, efficacy)
    );
    return TYPE_ORDER.map((attackingType) => {
        // each member's multiplier; a type in no non-neutral group is 1×
        const memberMultipliers = matchups.map(
            (groups) =>
                groups.find((group) => group.types.includes(attackingType))
                    ?.multiplier ?? 1
        );

        const weakCount = memberMultipliers.filter((m) => m >= 2).length;

        let band: DefensiveBand;
        if (weakCount > 0) {
            band = "weak";
        } else if (memberMultipliers.some((m) => m === 0)) {
            band = "immune";
        } else if (memberMultipliers.some((m) => m <= 0.5)) {
            band = "resistant";
        } else {
            band = "neutral";
        }

        return { type: attackingType, band, weakCount };
    });
};

/** The types one member hits for 2× or more with any of its own types. */
const coverageOf = (member: PokemonDetails, efficacy: TypeEfficacy) => {
    const covered = new Set<string>();
    for (const memberType of member.types) {
        for (const group of getOffense(memberType, efficacy)) {
            if (group.multiplier >= 2) {
                for (const type of group.types) {
                    covered.add(type);
                }
            }
        }
    }
    return covered;
};

/** The types at least one of `members` hits for 2× or more. */
const partyCoverage = (members: PokemonDetails[], efficacy: TypeEfficacy) => {
    const covered = new Set<string>();
    for (const member of members) {
        for (const type of coverageOf(member, efficacy)) {
            covered.add(type);
        }
    }
    return covered;
};

/**
 * For each of the 18 defending types, check whether any party member can hit
 * it for 2× or more via at least one of that member's own types. A member type
 * missing from the chart simply contributes nothing.
 * Returns exactly 18 entries in `TYPE_ORDER` order.
 */
export const computeOffensiveCoverage = (
    party: PokemonDetails[],
    efficacy: TypeEfficacy
): CoverageEntry[] => {
    const covered = partyCoverage(party, efficacy);
    return TYPE_ORDER.map((defendingType) => ({
        type: defendingType,
        covered: covered.has(defendingType),
    }));
};

/**
 * For each party member × each threat type, compute the defensive multiplier.
 * Returns one row per party member; each row's `multipliers` has one key per
 * threat type.
 */
export const computeThreatGrid = (
    party: PokemonDetails[],
    threats: string[],
    efficacy: TypeEfficacy
): ThreatGridRow[] => {
    return party.map((member) => {
        const groups = getTypeMatchups(member.types, efficacy);
        const multipliers: Record<string, number> = {};
        for (const threat of threats) {
            multipliers[threat] =
                groups.find((group) =>
                    group.types.includes(threat as PartyType)
                )?.multiplier ?? 1;
        }
        return { pokemon: member, multipliers };
    });
};

/**
 * Finds the weakest offensive contributor (fewest types only it covers; ties
 * go to the highest id) and up to 3 replacements from the same generation.
 *
 * A candidate is ranked by its net gain: how many more types the party covers
 * with the candidate in that slot instead of the current member. That counts
 * the gaps the candidate closes minus the types only the current member
 * covered, which the swap would lose. Only candidates with a gain above zero
 * qualify; ties go to the lower id. Candidates are default forms (no Mega or
 * Gigantamax) of species not already in the party.
 *
 * `party` is the six slots, empty ones as null, so `slotIndex` is the slot.
 * Returns null with fewer than 2 members, no coverage gap, or no candidate.
 */
export const rankReplacements = (
    party: (PokemonDetails | null)[],
    allPokemon: PokemonDetails[],
    efficacy: TypeEfficacy
): ReplacementEntry | null => {
    const filled = party.filter(
        (member): member is PokemonDetails => member !== null
    );
    if (filled.length < 2) return null;

    const covered = partyCoverage(filled, efficacy);
    if (TYPE_ORDER.every((type) => covered.has(type))) return null;

    const [weakest] = filled
        .map((member, index) => {
            const othersCovered = partyCoverage(
                filled.filter((_, other) => other !== index),
                efficacy
            );
            const unique = [...coverageOf(member, efficacy)].filter(
                (type) => !othersCovered.has(type)
            ).length;
            return { member, othersCovered, unique };
        })
        .sort((a, b) => a.unique - b.unique || b.member.id - a.member.id);

    const partySpecies = new Set(filled.map((member) => member.speciesId));

    const candidates = allPokemon
        .filter(
            (candidate) =>
                candidate.isDefault &&
                candidate.generationId === weakest.member.generationId &&
                !partySpecies.has(candidate.speciesId)
        )
        .map((candidate) => {
            const after = new Set(weakest.othersCovered);
            for (const type of coverageOf(candidate, efficacy)) {
                after.add(type);
            }
            return { candidate, gain: after.size - covered.size };
        })
        .filter(({ gain }) => gain > 0)
        .sort((a, b) => b.gain - a.gain || a.candidate.id - b.candidate.id)
        .slice(0, 3)
        .map(({ candidate }) => candidate);

    if (candidates.length === 0) return null;

    return {
        slotIndex: party.indexOf(weakest.member),
        currentPokemon: weakest.member,
        candidates,
    };
};
