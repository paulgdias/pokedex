import { ReactNode, useId } from "react";
import { twMerge } from "tailwind-merge";

import Panel from "@components/Panel";
import SectionLabel from "@components/SectionLabel";
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
        <Panel
            as="section"
            aria-labelledby={id}
            className={twMerge("flex flex-col gap-4 p-5", className)}
        >
            <SectionLabel as="h2" id={id}>
                {title}
            </SectionLabel>
            {children}
        </Panel>
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
