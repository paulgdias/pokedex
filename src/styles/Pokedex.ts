const buttonClass = `
    w-[140px] rounded-full p-[6px_10px]
    border border-black font-semibold text-black cursor-pointer my-3 mx-2
    transition-transform duration-300 ease-out transform hover:scale-105 focus:scale-105
`;
const gridClass = `grid grid-flow-row grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-9 gap-4 w-full`;
const cardClass = `flex flex-col justify-between relative max-w-sm rounded-2xl shadow-lg cursor-pointer hover:shadow-2xl border-4 border-amber-200`;
const imgClass = `w-[100%] h-auto rounded-xl`;
const cardStatsClass = `font-bold text-xl capitalize text-center mb-2`;
const pokedexIdClass = `text-sm text-gray-600 top-0 right-0 rounded-full px-3 py-1 font-semibold mr-2 mb-2 border-1 border-black`;
const placeholderClass = `rounded-full px-1 py-1 text-sm font-semibold text-white mr-1 mb-1 border-1 border-black text-shadow-sm/40`;
const placeholderWithBlurClass = `inline-block bg-gray-500 ${placeholderClass} blur-sm`;
const legendaryPokemonClass = `text-gray-300 animate-pulse absolute m-2`;
const mythicalPokemonClass = `text-yellow-400 animate-pulse absolute m-2`;
const placeholderImg =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPMLmr4DwAFCwJel48AAwAAAABJRU5ErkJggg==";

export {
    buttonClass,
    gridClass,
    cardClass,
    imgClass,
    cardStatsClass,
    pokedexIdClass,
    placeholderClass,
    placeholderWithBlurClass,
    legendaryPokemonClass,
    mythicalPokemonClass,
    placeholderImg,
};
