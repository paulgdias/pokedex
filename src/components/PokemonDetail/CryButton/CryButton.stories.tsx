import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { makeInfo } from "../../__fixtures__/pokemon";
import CryButton from ".";

const meta = {
    title: "PokemonDetail/CryButton",
    component: CryButton,
    args: { url: makeInfo().cry, name: "bulbasaur" },
    // an audio element whose cry is still playing when the play() resolves
    beforeEach: () => {
        const RealAudio = window.Audio;
        window.Audio = class {
            currentTime = 0;
            addEventListener() {
                /* unused */
            }
            pause() {
                /* unused */
            }
            play() {
                return Promise.resolve();
            }
        } as unknown as typeof Audio;
        return () => {
            window.Audio = RealAudio;
        };
    },
} satisfies Meta<typeof CryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlaysTheCry: Story = {
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole("button", {
            name: "Play bulbasaur's cry",
        });
        await expect(button).toBeEnabled();
        await expect(button).not.toHaveClass("text-accent");

        await userEvent.click(button);
        // the button is highlighted while the cry plays
        await expect(button).toHaveClass("text-accent");
    },
};

export const NoCryAvailable: Story = {
    args: { url: null },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("button", {
                name: "Play bulbasaur's cry",
            })
        ).toBeDisabled();
    },
};
