import { ArrowDown, ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { twMerge } from "tailwind-merge";

import {
    EvolutionLane,
    EvolutionStep,
    PokemonDetails,
    typeColors,
} from "@customTypes/PokemonTypes";
import { typeDotClass } from "@styles/Pokedex";
import { buildEvolutionLanes } from "@utils/evolution";
import { formatPokedexNumber } from "@utils/search";
import { useNavigateToPokemon } from "@utils/useNavigateToPokemon";

const FORM_LABELS: Record<string, string> = {
    mega: "Mega Evolution",
    gmax: "Gigantamax",
};

const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1);

/** "charizard-mega-x" -> "Mega Charizard X" */
const formatFormName = (form: PokemonDetails, base: PokemonDetails) => {
    const suffix = form.name.startsWith(`${base.name}-`)
        ? form.name.slice(base.name.length + 1).split("-")
        : [form.name];
    const [first, ...rest] = suffix;
    const prefix = first === "gmax" ? "Gigantamax" : capitalize(first);
    return [prefix, capitalize(base.name), ...rest.map(capitalize)].join(" ");
};

const Thumbnail = ({
    pokemon,
    className,
}: {
    pokemon: PokemonDetails;
    className: string;
}) => (
    <span
        className={twMerge(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand",
            className
        )}
    >
        {pokemon.sprite && (
            <img
                src={pokemon.sprite}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-contain"
            />
        )}
    </span>
);

const Connector = ({ method }: { method: string | null }) => (
    <div className="flex h-9 items-center justify-center gap-2 text-subtle md:h-30 md:w-36 md:shrink-0 md:px-2 md:flex-col md:gap-1">
        {method && (
            <span className="rounded-full bg-chip px-2.5 py-0.5 text-center text-xs leading-snug font-semibold text-pill-text">
                <span className="sr-only">Evolves by </span>
                {method}
            </span>
        )}
        <ArrowDown size={18} aria-hidden="true" className="md:hidden" />
        <ArrowRight size={22} aria-hidden="true" className="hidden md:block" />
    </div>
);

const Node = ({
    step,
    isCurrent,
    onSelect,
}: {
    step: EvolutionStep;
    isCurrent: boolean;
    onSelect: ReturnType<typeof useNavigateToPokemon>;
}) => {
    const { pokemon } = step;
    const className = twMerge(
        // border-2 on the current card (p-[10px]) keeps sizes equal and, unlike
        // a ring, is not clipped by the lane's scroll container
        "flex items-center gap-4 rounded-2xl border bg-surface p-[11px]",
        isCurrent
            ? "border-2 border-accent p-2.5"
            : "border-line hover:border-line-strong"
    );
    const content = (
        <>
            <Thumbnail pokemon={pokemon} className="size-24" />
            <span className="flex min-w-0 flex-col gap-1.5">
                <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-lg leading-tight font-bold capitalize">
                        {pokemon.name}
                    </span>
                    <span className="font-mono text-xs text-subtle">
                        {formatPokedexNumber(pokemon.id)}
                    </span>
                </span>
                <span className="flex flex-wrap gap-x-2.5 gap-y-1">
                    {pokemon.types.map((type) => (
                        <span
                            key={type}
                            className="flex items-center gap-1.5 text-sm font-semibold capitalize text-pill-text"
                        >
                            <span
                                className={`${typeDotClass} ${typeColors[type]}`}
                            />
                            {type}
                        </span>
                    ))}
                </span>
            </span>
        </>
    );

    if (isCurrent) {
        return (
            <div aria-current="page" className={className}>
                {content}
            </div>
        );
    }

    return (
        <a
            href={`/pokedex/${pokemon.name}`}
            className={className}
            onClick={(event) => {
                event.preventDefault();
                onSelect(event, pokemon);
            }}
        >
            {content}
        </a>
    );
};

const OtherForms = ({
    step,
    currentId,
    onSelect,
}: {
    step: EvolutionStep;
    currentId: number;
    onSelect: ReturnType<typeof useNavigateToPokemon>;
}) => (
    <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line-strong bg-paper p-2.5">
        <span className="text-[11px] font-bold tracking-wider text-muted uppercase">
            Other forms
        </span>
        {step.forms.map((form) => {
            const isCurrent = form.id === currentId;
            const content = (
                <>
                    <Thumbnail pokemon={form} className="size-12 rounded-lg" />
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-bold">
                            {formatFormName(form, step.pokemon)}
                        </span>
                        <span className="text-xs text-muted">
                            {FORM_LABELS[form.form ?? ""]}
                        </span>
                    </span>
                </>
            );
            const className = twMerge(
                "flex items-center gap-2.5 rounded-lg border-2 border-transparent p-0.5",
                isCurrent ? "border-accent bg-surface" : "hover:bg-chip"
            );

            if (isCurrent) {
                return (
                    <div
                        key={form.id}
                        aria-current="page"
                        className={className}
                    >
                        {content}
                    </div>
                );
            }

            return (
                <a
                    key={form.id}
                    href={`/pokedex/${form.name}`}
                    className={className}
                    onClick={(event) => {
                        event.preventDefault();
                        onSelect(event, form);
                    }}
                >
                    {content}
                </a>
            );
        })}
    </div>
);

const Lane = ({
    lane,
    label,
    currentId,
    onSelect,
}: {
    lane: EvolutionLane;
    label: string | null;
    currentId: number;
    onSelect: ReturnType<typeof useNavigateToPokemon>;
}) => (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/60 p-4 md:p-5">
        {label && (
            <h3 className="text-[13px] font-bold tracking-wider text-muted uppercase">
                {label}
            </h3>
        )}
        <div className="pokedex-scroll flex flex-col md:flex-row md:overflow-x-auto md:pb-1">
            {lane.stages.map((stage, index) => (
                <Fragment key={stage[0].pokemon.id}>
                    <div className="flex flex-col gap-3 md:gap-4">
                        {stage.map((step) => (
                            <div
                                key={step.pokemon.id}
                                className="flex flex-col md:flex-row md:items-start"
                            >
                                {index > 0 && (
                                    <Connector method={step.method} />
                                )}
                                <div className="flex w-full max-w-72 flex-col gap-2 md:w-72 md:shrink-0">
                                    <Node
                                        step={step}
                                        isCurrent={
                                            step.pokemon.id === currentId
                                        }
                                        onSelect={onSelect}
                                    />
                                    {step.forms.length > 0 && (
                                        <OtherForms
                                            step={step}
                                            currentId={currentId}
                                            onSelect={onSelect}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Fragment>
            ))}
        </div>
    </div>
);

const EvolutionChain = ({
    pokemon,
    previous,
}: {
    pokemon: PokemonDetails;
    previous?: string;
}) => {
    const onSelect = useNavigateToPokemon(previous);
    const lanes = buildEvolutionLanes(pokemon.evolutions);
    // a lone Pokémon still gets the section if it has Mega/Gmax forms
    const hasBranches = lanes.some((lane) =>
        lane.stages.some((stage) => stage.length > 1 || stage[0].forms.length)
    );

    if (lanes.length === 1 && lanes[0].stages.length < 2 && !hasBranches) {
        return null;
    }

    return (
        <section
            aria-labelledby="evolution-chain"
            className="flex flex-col gap-4"
        >
            <h2
                id="evolution-chain"
                className="font-display text-2xl font-bold tracking-tight"
            >
                Evolution chain
            </h2>
            {lanes.map((lane) => (
                <Lane
                    key={lane.region ?? "standard"}
                    lane={lane}
                    label={
                        lanes.length > 1
                            ? lane.region
                                ? capitalize(lane.region)
                                : "Standard"
                            : null
                    }
                    currentId={pokemon.id}
                    onSelect={onSelect}
                />
            ))}
        </section>
    );
};

export default EvolutionChain;
