import { X } from "lucide-react";

import { getGeneration } from "@utils/generations";
import { PokedexFilters, capitalize } from "@utils/search";

interface Chip {
    key: string;
    kind: string;
    label: string;
    remove: () => void;
}

const getChips = (
    filters: PokedexFilters,
    onChange: (patch: Partial<PokedexFilters>) => void
): Chip[] => {
    const chips: Chip[] = [];
    const generation = getGeneration(filters.generation);
    if (generation) {
        chips.push({
            key: "gen",
            kind: "Gen",
            label: `${generation.roman} · ${generation.region}`,
            remove: () => onChange({ generation: null }),
        });
    }
    for (const type of filters.types) {
        chips.push({
            key: `type-${type}`,
            kind: "Type",
            label: capitalize(type),
            remove: () =>
                onChange({
                    types: filters.types.filter((item) => item !== type),
                }),
        });
    }
    if (filters.category) {
        chips.push({
            key: "only",
            kind: "Only",
            label: capitalize(filters.category),
            remove: () => onChange({ category: null }),
        });
    }
    if (filters.text.trim()) {
        chips.push({
            key: "search",
            kind: "Search",
            label: `“${filters.text.trim()}”`,
            remove: () => onChange({ text: "" }),
        });
    }
    return chips;
};

const FilterChips = ({
    filters,
    onChange,
    onClearAll,
}: {
    filters: PokedexFilters;
    onChange: (patch: Partial<PokedexFilters>) => void;
    onClearAll: () => void;
}) => {
    const chips = getChips(filters, onChange);
    if (chips.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map(({ key, kind, label, remove }) => (
                <button
                    key={key}
                    type="button"
                    aria-label={`Remove filter ${kind} ${label}`}
                    onClick={remove}
                    className="flex h-8 items-center gap-2 rounded-full border border-line-strong bg-chip pr-2 pl-3 text-[13px] font-semibold text-ink hover:bg-chip-hover"
                >
                    <span className="font-medium text-subtle">{kind}</span>
                    {label}
                    <X size={14} className="text-muted" aria-hidden="true" />
                </button>
            ))}
            <button
                type="button"
                onClick={onClearAll}
                className="h-8 px-2 text-[13px] font-semibold text-accent hover:text-accent-strong"
            >
                Clear all
            </button>
        </div>
    );
};

export default FilterChips;
