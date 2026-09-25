// the focus border is a pseudo-element drawn over the card's contents: an
// outline can be clipped by the virtualized grid and renders unevenly on
// rounded corners, and an inset ring would sit under the art area's background
const cardClass = `
    relative flex flex-col overflow-hidden rounded-2xl border border-line
    bg-surface transition-shadow duration-150
    hover:shadow-hover focus-visible:outline-none
    after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit]
    after:border-2 after:border-transparent focus-visible:after:border-accent
`;
const cardArtClass = `relative flex items-center justify-center bg-sand`;
const cardNumberWatermarkClass = `
    absolute select-none font-mono text-[40px] font-semibold text-ink/10
`;
const cardBodyClass = `flex flex-col gap-2 px-3.5 pt-3 pb-3.5`;
const typePillClass = `
    flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full
    bg-chip px-2.5 text-xs font-semibold capitalize text-pill-text
`;
const typeDotClass = `size-2 shrink-0 rounded-full ring-1 ring-inset ring-black/20`;
const legendaryPokemonClass = `text-[#9aa3b5]`;
const mythicalPokemonClass = `text-[#d9a515]`;
const categoryBadgeClass = `
    absolute left-2.5 top-2.5 flex drop-shadow-[0_1px_1px_rgba(27,26,23,.35)]
`;

export {
    cardClass,
    cardArtClass,
    cardNumberWatermarkClass,
    cardBodyClass,
    typePillClass,
    typeDotClass,
    legendaryPokemonClass,
    mythicalPokemonClass,
    categoryBadgeClass,
};
