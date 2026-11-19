import { useQuery } from "@tanstack/react-query";
import { preconnect } from "react-dom";
import { useLoaderData, useSearchParams } from "react-router";

import { typeEfficacyQueryOptions } from "@api/pokedex";
import Button from "@components/Buttons/Button";
import PageHeader from "@components/PageHeader";
import DefensiveProfile from "@components/Party/DefensiveProfile";
import MemberMatchups from "@components/Party/MemberMatchups";
import OffensiveCoverage from "@components/Party/OffensiveCoverage";
import PartySlots from "@components/Party/PartySlots";
import ReplacementSuggestions from "@components/Party/ReplacementSuggestions";
import ThreatAnalysis from "@components/Party/ThreatAnalysis";
import { PokemonDetails } from "@customTypes/PokemonTypes";
import {
    parseParty,
    parseThreats,
    serializeParty,
    serializeThreats,
} from "@utils/partyAnalyzer";

const PARTY_PARAM = "party";
const THREATS_PARAM = "threats";

const Party: React.FC = () => {
    preconnect("https://graphql.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const allPokemon = useLoaderData() as PokemonDetails[];
    const {
        data: efficacy,
        isLoading,
        isError,
        refetch,
    } = useQuery(typeEfficacyQueryOptions);
    const [params, setParams] = useSearchParams();

    const party = parseParty(params.get(PARTY_PARAM), allPokemon);
    const threats = parseThreats(params.get(THREATS_PARAM));
    const filledParty = party.filter(
        (pokemon): pokemon is PokemonDetails => pokemon !== null
    );

    // the URL is the only store: every change rewrites one param in place
    const writeParam = (key: string, value: string | null) => {
        const updated = new URLSearchParams(params);
        if (value) {
            updated.set(key, value);
        } else {
            updated.delete(key);
        }
        setParams(updated, { replace: true, preventScrollReset: true });
    };

    const setPartySlot = (index: number, id: number | null) => {
        const next = [...party];
        next[index] =
            id === null
                ? null
                : (allPokemon.find((pokemon) => pokemon.id === id) ?? null);
        writeParam(
            PARTY_PARAM,
            next.some(Boolean) ? serializeParty(next) : null
        );
    };

    const addThreat = (type: string) => {
        if (!threats.includes(type)) {
            writeParam(THREATS_PARAM, serializeThreats([...threats, type]));
        }
    };

    const removeThreat = (type: string) => {
        writeParam(
            THREATS_PARAM,
            serializeThreats(threats.filter((threat) => threat !== type))
        );
    };

    return (
        <div className="pokedex-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
            <PageHeader className="gap-2">
                <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">
                    Party Analyzer
                </h1>
                <p className="text-[15px] text-muted">
                    Build a party of up to six Pokémon to see how they cover
                    each other.
                </p>
            </PageHeader>

            <div className="flex flex-col gap-10 px-4 py-7 lg:px-8">
                <PartySlots
                    party={party}
                    allPokemon={allPokemon}
                    onSet={setPartySlot}
                />

                {isLoading && (
                    <p role="status" className="text-[15px] text-muted">
                        Loading…
                    </p>
                )}
                {isError && (
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-[15px] text-muted">
                            Couldn't load type data. Please try again.
                        </p>
                        <Button size="sm" onPress={() => refetch()}>
                            Try again
                        </Button>
                    </div>
                )}
                {efficacy && (
                    <>
                        <DefensiveProfile
                            party={filledParty}
                            efficacy={efficacy}
                        />
                        <OffensiveCoverage
                            party={filledParty}
                            efficacy={efficacy}
                        />
                        <MemberMatchups
                            party={filledParty}
                            efficacy={efficacy}
                        />
                        <ThreatAnalysis
                            party={filledParty}
                            threats={threats}
                            efficacy={efficacy}
                            onAddThreat={addThreat}
                            onRemoveThreat={removeThreat}
                        />
                        <ReplacementSuggestions
                            party={party}
                            allPokemon={allPokemon}
                            efficacy={efficacy}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Party;
