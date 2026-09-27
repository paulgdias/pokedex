import { ToggleButton, ToggleButtonGroup } from "react-aria-components";

export type SpriteView = "artwork" | "in-game";

const OPTIONS: { id: SpriteView; label: string }[] = [
    { id: "artwork", label: "Artwork" },
    { id: "in-game", label: "In-Game" },
];

const SpriteToggle = ({
    value,
    onChange,
    isInGameAvailable,
}: {
    value: SpriteView;
    onChange: (value: SpriteView) => void;
    isInGameAvailable: boolean;
}) => (
    <ToggleButtonGroup
        aria-label="Image style"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
            const [id] = Array.from(keys);
            onChange(id as SpriteView);
        }}
        className="absolute right-2.5 bottom-2.5 z-10 flex gap-0.5 rounded-xl bg-track p-[3px]"
    >
        {OPTIONS.map(({ id, label }) => (
            <ToggleButton
                key={id}
                id={id}
                isDisabled={id === "in-game" && !isInGameAvailable}
                className={({ isSelected, isDisabled }) =>
                    `h-8 cursor-pointer rounded-[9px] px-3 text-sm font-semibold ${
                        isSelected
                            ? "bg-accent text-on-accent shadow-segment"
                            : "text-muted"
                    } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`
                }
            >
                {label}
            </ToggleButton>
        ))}
    </ToggleButtonGroup>
);

export default SpriteToggle;
