export const typeColors = {
	grass: "bg-grass",
	fire: "bg-fire",
	water: "bg-water",
	bug: "bg-bug",
	normal: "bg-normal",
	electric: "bg-electric",
	ground: "bg-ground",
	fairy: "bg-fairy",
	poison: "bg-poison",
	fighting: "bg-fighting",
	psychic: "bg-psychic",
	rock: "bg-rock",
	ghost: "bg-ghost",
	dragon: "bg-dragon",
	dark: "bg-dark",
	flying: "bg-flying",
	steel: "bg-steel",
	ice: "bg-ice",
};

export type Pokemon = {
	id: number;
	name: string;
	sprites: { default: string | null }[];
	types: { type: { name: keyof typeof typeColors } }[];
	specs: { is_legendary: boolean; is_mythical: boolean; generation_id: number };
};

export type PokedexResult = {
	pokemon: Pokemon[];
};