const cardClass = `
    flex flex-col overflow-hidden rounded-2xl border border-line bg-surface
    transition-[box-shadow,transform] duration-150
    hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(40,32,20,.10)]
`;
const cardArtClass = `relative flex items-center justify-center bg-sand`;
const cardNumberWatermarkClass = `
    absolute select-none font-mono text-[40px] font-semibold text-ink/10
`;
const cardBodyClass = `flex flex-col gap-2 px-3.5 pt-3 pb-3.5`;
const typePillClass = `
    flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full
    bg-chip px-2.5 text-xs font-semibold capitalize text-[#3d3a33]
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
