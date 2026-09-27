import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
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
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const artwork = canvas.getByRole("radio", { name: "Artwork" });
        const inGame = canvas.getByRole("radio", { name: "In-Game" });
        await expect(artwork).toBeChecked();

        await userEvent.click(inGame);
        await expect(args.onChange).toHaveBeenLastCalledWith("in-game");
        await expect(inGame).toBeChecked();
        await expect(artwork).not.toBeChecked();

        await userEvent.click(artwork);
        await expect(args.onChange).toHaveBeenLastCalledWith("artwork");
    },
};

export const InGameUnavailable: Story = {
    args: { isInGameAvailable: false },
    play: async ({ args, canvasElement }) => {
        const inGame = within(canvasElement).getByRole("radio", {
            name: "In-Game",
        });
        await expect(inGame).toBeDisabled();

        await userEvent.click(inGame);
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};
