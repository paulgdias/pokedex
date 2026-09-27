export interface Generation {
    id: number;
    roman: string;
    region: string;
}

export const GENERATIONS: Generation[] = [
    { id: 1, roman: "I", region: "Kanto" },
    { id: 2, roman: "II", region: "Johto" },
    { id: 3, roman: "III", region: "Hoenn" },
    { id: 4, roman: "IV", region: "Sinnoh" },
    { id: 5, roman: "V", region: "Unova" },
    { id: 6, roman: "VI", region: "Kalos" },
    { id: 7, roman: "VII", region: "Alola" },
    { id: 8, roman: "VIII", region: "Galar" },
    { id: 9, roman: "IX", region: "Paldea" },
];

export const getGeneration = (id: number | null): Generation | undefined =>
    GENERATIONS.find((generation) => generation.id === id);

export const countByGeneration = (
    pokemon: { generationId: number }[]
): Map<number, number> => {
    const counts = new Map<number, number>();
    for (const { generationId } of pokemon) {
        counts.set(generationId, (counts.get(generationId) ?? 0) + 1);
    }
    return counts;
};
