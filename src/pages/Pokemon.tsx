import { useEffect, useMemo, useRef, useState } from "react";
import { preconnect, preload } from "react-dom";
import {
    useLoaderData,
    useLocation,
    useNavigate,
    useParams,
} from "react-router";

import { useQuery } from "@tanstack/react-query";
import { Button } from "react-aria-components";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import ScrollTopButton from "@components/Buttons/ScrollTopButton";
import EvolutionChain from "@components/EvolutionChain";
import PokemonCard from "@components/PokemonCard";
import AbilityList from "@components/PokemonDetail/AbilityList";
import CryButton from "@components/PokemonDetail/CryButton";
import InfoFacts from "@components/PokemonDetail/InfoFacts";
import PokedexEntry from "@components/PokemonDetail/PokedexEntry";
import Section, { InfoSection } from "@components/PokemonDetail/Section";
import StatBars from "@components/PokemonDetail/StatBars";
import TypeMatchups from "@components/PokemonDetail/TypeMatchups";
import SpriteToggle, { SpriteView } from "@components/SpriteToggle";

import {
    pokemonInfoQueryOptions,
    pokemonSpritesQueryOptions,
    typeEfficacyQueryOptions,
} from "@api/pokedex";

import { getGeneration } from "@utils/generations";
import { PokemonLocationState } from "@utils/useNavigateToPokemon";

import { PokemonDetails } from "@customTypes/PokemonTypes";

const isTypingTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const Pokemon: React.FC = () => {
    preconnect("https://beta.pokeapi.co");
    preconnect("https://raw.githubusercontent.com/");

    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const params = useParams();
    const state = useLocation().state as PokemonLocationState | null;
    const previous = state?.previous || "/pokedex";

    const pokemonName = params?.pokemon;
    // the pokedex loader already attaches each pokemon's evolutions
    const pokedexList = useLoaderData() as PokemonDetails[];
    const pokemon = pokedexList.find((item) => item.name === pokemonName);
    const id = pokemon?._id ?? 0;

    // neighbours in national dex order (alternate forms share their base
    // form's position)
    const { prev, next } = useMemo(() => {
        const ordered = pokedexList
            .filter((item) => item.isDefault)
            .sort((a, b) => a._id - b._id);
        const index = ordered.findIndex(
            (item) => item.speciesId === pokemon?.speciesId
        );
        return {
            prev: index > 0 ? ordered[index - 1] : undefined,
            next: index >= 0 ? ordered[index + 1] : undefined,
        };
    }, [pokedexList, pokemon?.speciesId]);

    const goTo = (target: PokemonDetails | undefined) => {
        if (target) {
            navigate(`/pokedex/${target.name}`, {
                state: { pokemon: target, previous },
            });
        }
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.defaultPrevented ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                isTypingTarget(event.target)
            ) {
                return;
            }
            if (event.key === "ArrowLeft") {
                goTo(prev);
            } else if (event.key === "ArrowRight") {
                goTo(next);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // goTo only closes over navigate/previous, which change with prev/next
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prev, next, previous]);

    // the choices stay while moving between pokemon; each falls back when a
    // pokemon has no such render
    const [view, setView] = useState<SpriteView>("artwork");
    const [isShiny, setIsShiny] = useState(false);
    const enabled = Boolean(pokemon);
    const spritesQuery = useQuery({
        ...pokemonSpritesQueryOptions(id),
        enabled,
    });
    const infoQuery = useQuery({ ...pokemonInfoQueryOptions(id), enabled });
    const efficacyQuery = useQuery(typeEfficacyQueryOptions);

    const sprites = spritesQuery.data;
    const is3d = view === "3d" && Boolean(sprites?.home);
    const shinySprite = is3d ? sprites?.homeShiny : sprites?.artworkShiny;
    const sprite =
        isShiny && shinySprite
            ? shinySprite
            : is3d
              ? (sprites?.home ?? undefined)
              : undefined;
    if (sprites?.home) {
        preload(sprites.home, { as: "image" });
    }

    useEffect(() => {
        if (!pokemon) {
            navigate("/pokedex", { replace: true });
        }
    }, [pokemon, navigate]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [pokemonName]);

    if (!pokemon) {
        return null;
    }

    const generation = getGeneration(pokemon.generationId);

    return (
        <div
            ref={scrollRef}
            className="pokedex-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
            <div className="flex flex-col gap-4 border-b border-line px-4 pt-5 pb-4 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        aria-label="Back to Pokémon"
                        className="flex h-10 w-fit cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-line-strong bg-surface pr-4 pl-3 text-sm font-semibold text-ink hover:bg-chip"
                        onPress={() => navigate(previous)}
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        Back to Pokédex
                    </Button>
                    <nav aria-label="Adjacent Pokémon" className="flex gap-2">
                        {[
                            {
                                target: prev,
                                Icon: ChevronLeft,
                                word: "Previous",
                            },
                            { target: next, Icon: ChevronRight, word: "Next" },
                        ].map(({ target, Icon, word }) => (
                            <Button
                                key={word}
                                aria-label={
                                    target
                                        ? `${word}: ${target.name}`
                                        : `${word} Pokémon`
                                }
                                isDisabled={!target}
                                onPress={() => goTo(target)}
                                className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-line-strong bg-surface text-ink hover:bg-chip disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Icon size={18} aria-hidden="true" />
                            </Button>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
                    <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight capitalize">
                        {pokemon.name}
                    </h1>
                    {generation && (
                        <span className="text-[15px] text-muted">
                            Generation {generation.roman} · {generation.region}
                        </span>
                    )}
                    <CryButton
                        url={infoQuery.data?.cry ?? null}
                        name={pokemon.name}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-10 px-4 py-7 lg:px-8">
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
                    <div className="flex flex-col gap-6">
                        <PokemonCard
                            className="w-full"
                            size="large"
                            pokemon={pokemon}
                            sprite={sprite}
                            isLegendary={pokemon.isLegendary}
                            isMythical={pokemon.isMythical}
                        >
                            <SpriteToggle
                                value={is3d ? "3d" : "artwork"}
                                onChange={setView}
                                is3dAvailable={Boolean(sprites?.home)}
                                isShiny={Boolean(isShiny && shinySprite)}
                                onShinyChange={setIsShiny}
                                isShinyAvailable={Boolean(shinySprite)}
                            />
                        </PokemonCard>
                        <InfoSection title="Details" query={infoQuery}>
                            {(info) => <InfoFacts info={info} />}
                        </InfoSection>
                    </div>
                    <div className="grid gap-6 xl:grid-cols-2">
                        <InfoSection
                            title="Pokédex entry"
                            query={infoQuery}
                            className="xl:col-span-2"
                        >
                            {(info) => (
                                <PokedexEntry key={pokemon._id} info={info} />
                            )}
                        </InfoSection>
                        <Section title="Base stats">
                            <StatBars
                                stats={pokemon.stats}
                                total={pokemon.statTotal}
                            />
                        </Section>
                        <InfoSection title="Abilities" query={infoQuery}>
                            {(info) => (
                                <AbilityList abilities={info.abilities} />
                            )}
                        </InfoSection>
                        <Section
                            title="Type matchups"
                            className="xl:col-span-2"
                        >
                            {efficacyQuery.data ? (
                                <TypeMatchups
                                    types={pokemon.types}
                                    efficacy={efficacyQuery.data}
                                />
                            ) : (
                                <p className="text-sm text-muted">
                                    {efficacyQuery.isError
                                        ? "Couldn’t load type matchups."
                                        : "Loading…"}
                                </p>
                            )}
                        </Section>
                    </div>
                </div>
                <EvolutionChain pokemon={pokemon} previous={previous} />
            </div>
            <ScrollTopButton
                onPress={() => scrollRef.current?.scrollTo({ top: 0 })}
            />
        </div>
    );
};

export default Pokemon;
