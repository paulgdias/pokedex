import { ReactNode, useId } from "react";

import { twMerge } from "tailwind-merge";

import { PokemonInfo } from "@customTypes/PokemonTypes";

const Section = ({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children: ReactNode;
}) => {
    const id = useId();

    return (
        <section
            aria-labelledby={id}
            className={twMerge(
                "flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5",
                className
            )}
        >
            <h2
                id={id}
                className="text-[13px] font-bold tracking-wider text-muted uppercase"
            >
                {title}
            </h2>
            {children}
        </section>
    );
};

/** A section whose content needs the pokémon's lazily fetched info. */
export const InfoSection = ({
    title,
    className,
    query,
    children,
}: {
    title: string;
    className?: string;
    query: { data?: PokemonInfo; isError: boolean };
    children: (info: PokemonInfo) => ReactNode;
}) => (
    <Section title={title} className={className}>
        {query.data ? (
            children(query.data)
        ) : query.isError ? (
            <p className="text-sm text-muted">Couldn’t load this section.</p>
        ) : (
            <div
                role="status"
                aria-busy="true"
                aria-label="Loading"
                className="flex animate-pulse flex-col gap-2.5"
            >
                <div className="h-4 w-3/4 rounded bg-track" />
                <div className="h-4 w-1/2 rounded bg-track" />
                <div className="h-4 w-2/3 rounded bg-track" />
            </div>
        )}
    </Section>
);

export default Section;
