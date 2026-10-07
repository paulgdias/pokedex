import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
    bulbasaur,
    MEW,
    MEWTWO,
    MISSINGNO,
    PIXELATED_SPRITE,
} from "../__fixtures__/pokemon";
import PokemonCard from ".";

const meta = {
    title: "Pokedex/PokemonCard",
    component: PokemonCard,
    args: { pokemon: bulbasaur, navigateCallback: fn() },
    decorators: [
        (Story) => (
            <div className="w-56">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PokemonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Navigates: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const card = canvas.getByLabelText("Pokemon Card for bulbasaur");
        await expect(canvas.getByText("bulbasaur")).toBeVisible();
        await expect(canvas.getByText("#0001")).toBeVisible();
        await expect(canvas.getByText("grass")).toBeVisible();
        await expect(canvas.getByText("poison")).toBeVisible();

        await userEvent.click(card);
        await expect(args.navigateCallback).toHaveBeenCalledTimes(1);
        await expect(args.navigateCallback).toHaveBeenLastCalledWith(
            expect.anything(),
            bulbasaur
        );

        card.focus();
        await userEvent.keyboard("{Enter}");
        await expect(args.navigateCallback).toHaveBeenCalledTimes(2);

        // other keys do nothing
        await userEvent.keyboard("a");
        await expect(args.navigateCallback).toHaveBeenCalledTimes(2);
    },
};

export const Static: Story = {
    args: { navigateCallback: undefined },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const card = canvas.getByLabelText("Pokemon Card for bulbasaur");
        // no callback: not a link, not focusable, no pointer cursor
        await expect(canvas.queryByRole("link")).toBeNull();
        await expect(card).toHaveAttribute("tabindex", "-1");
        await expect(getComputedStyle(card).cursor).toBe("auto");
    },
};

export const Legendary: Story = {
    args: { pokemon: MEWTWO, isLegendary: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole("img", { name: "Legendary" })
        ).toBeVisible();
    },
};

export const Mythical: Story = {
    args: { pokemon: MEW, isMythical: true, isLegendary: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // mythical wins over legendary
        await expect(
            canvas.getByRole("img", { name: "Mythical" })
        ).toBeVisible();
        await expect(
            canvas.queryByRole("img", { name: "Legendary" })
        ).toBeNull();
    },
};

export const WithoutArtwork: Story = {
    args: { pokemon: MISSINGNO },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByAltText("missingno")).toBeNull();
        // the dex number stands in for the art, as decoration: generated
        // content, so it is neither read out nor checked for text contrast
        const watermark = canvasElement.querySelector("[data-number]");
        await expect(watermark).toHaveAttribute("data-number", "999");
        await expect(watermark).toHaveAttribute("aria-hidden", "true");
        await expect(getComputedStyle(watermark!, "::before").content).toBe(
            '"999"'
        );
    },
};

export const LargePixelated: Story = {
    args: {
        size: "large",
        pixelated: true,
        sprite: PIXELATED_SPRITE,
        navigateCallback: undefined,
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const image = canvas.getByAltText("bulbasaur");
        await expect(image).toHaveAttribute("src", args.sprite);
        await expect(getComputedStyle(image).imageRendering).toBe("pixelated");
        await expect(image.className).toContain("h-48");
    },
};
