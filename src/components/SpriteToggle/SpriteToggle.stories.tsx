import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import SpriteToggle, { SpriteView } from ".";

const meta = {
    title: "PokemonDetail/SpriteToggle",
    component: SpriteToggle,
    args: { value: "artwork", isInGameAvailable: true, onChange: fn() },
    // the toggle is absolutely positioned over a card's art
    decorators: [
        (Story) => (
            <div className="relative h-16 w-64">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof SpriteToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SwitchesView: Story = {
    render: (args) => {
        const [value, setValue] = useState<SpriteView>(args.value);
        return (
            <SpriteToggle
                {...args}
                value={value}
                onChange={(next) => {
                    setValue(next);
                    args.onChange(next);
                }}
            />
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const artwork = canvas.getByRole("radio", { name: "Artwork" });
        const inGame = canvas.getByRole("radio", { name: "In-Game" });
        await expect(artwork).toBeChecked();

        // the highlight follows the choice; onChange is unit-tested
        await userEvent.click(inGame);
        await expect(inGame).toBeChecked();
        await expect(artwork).not.toBeChecked();
        await expect(getComputedStyle(inGame).backgroundColor).not.toBe(
            getComputedStyle(artwork).backgroundColor
        );
    },
};

export const InGameUnavailable: Story = {
    args: { isInGameAvailable: false },
    play: async ({ canvasElement }) => {
        const inGame = within(canvasElement).getByRole("radio", {
            name: "In-Game",
        });
        // dimmed and unavailable; that it ignores presses is unit-tested
        await expect(inGame).toBeDisabled();
        await expect(getComputedStyle(inGame).opacity).toBe("0.5");
    },
};
