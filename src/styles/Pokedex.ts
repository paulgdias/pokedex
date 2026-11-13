// the focus border is a pseudo-element drawn over the card's contents: an
// outline can be clipped by the virtualized grid and renders unevenly on
// rounded corners, and an inset ring would sit under the art area's background
const cardClass = `
    group relative flex flex-col overflow-hidden rounded-[28px] border-2
    border-transparent bg-surface shadow-segment
    transition-[transform,box-shadow,border-color] duration-300
    hover:-translate-y-0.5 hover:border-[var(--card-edge,var(--color-line-strong))] hover:shadow-hover
    motion-reduce:transition-none motion-reduce:hover:translate-y-0
    focus-visible:outline-none
    after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit]
    after:border-2 after:border-transparent focus-visible:after:border-accent
`;
// --card-art lets a page tint the art area (e.g. by type); sand by default
const cardArtClass = `relative flex items-center justify-center [background:var(--card-art,var(--color-sand))]`;
// The number is drawn from `data-number` as generated content: it is a faint
// decoration (below any text contrast ratio), so it is kept out of the text.
const cardNumberWatermarkClass = `
    absolute right-4 bottom-2 select-none font-display text-[60px] leading-none
    font-extrabold tracking-tighter text-white/25
    before:content-[attr(data-number)]
`;
const pixelArtClass = `[image-rendering:pixelated]`;
const cardBodyClass = `flex flex-col gap-2.5 px-4 pt-3.5 pb-4`;
const typePillClass = `
    flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full
    bg-chip px-2.5 text-xs font-semibold capitalize text-pill-text
`;
// tinted by the --pill custom property (a type color); the text mixes it with
// the ink color so contrast holds in both themes
const tintedPillClass = `
    flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3
    text-xs font-extrabold capitalize
    bg-[color-mix(in_srgb,var(--pill)_14%,transparent)]
    text-[color-mix(in_srgb,var(--pill)_40%,var(--color-ink))]
`;
const typeDotClass = `size-2 shrink-0 rounded-full ring-1 ring-inset ring-black/20`;
const legendaryPokemonClass = `text-[#9aa3b5]`;
const mythicalPokemonClass = `text-[#d9a515]`;
const categoryBadgeClass = `
    absolute left-2.5 top-2.5 flex drop-shadow-[0_1px_1px_rgba(27,26,23,.35)]
`;

// the type-tinted gradient shared by the Pokédex cards, the detail page's large
// card and its header banner, so a pokémon looks the same everywhere
const typeGradient = (type: string) =>
    `linear-gradient(135deg, var(--color-${type}), color-mix(in srgb, var(--color-${type}) 55%, white))`;

export {
    cardArtClass,
    cardBodyClass,
    cardClass,
    cardNumberWatermarkClass,
    categoryBadgeClass,
    legendaryPokemonClass,
    mythicalPokemonClass,
    pixelArtClass,
    tintedPillClass,
    typeDotClass,
    typeGradient,
    typePillClass,
};
