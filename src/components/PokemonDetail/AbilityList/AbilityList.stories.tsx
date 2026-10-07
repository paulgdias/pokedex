import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { makeInfo } from "../../__fixtures__/pokemon";
import AbilityList from ".";

const meta = {
    title: "PokemonDetail/AbilityList",
    component: AbilityList,
    args: { abilities: makeInfo().abilities },
} satisfies Meta<typeof AbilityList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHiddenAbility: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const items = canvas.getAllByRole("listitem");
        await expect(items).toHaveLength(2);

        await expect(within(items[0]).getByText("Overgrow")).toBeVisible();
        await expect(within(items[0]).queryByText("Hidden")).toBeNull();
        await expect(
            within(items[0]).getByText("Powers up Grass moves in a pinch.")
        ).toBeVisible();

        await expect(within(items[1]).getByText("Chlorophyll")).toBeVisible();
        await expect(within(items[1]).getByText("Hidden")).toBeVisible();
    },
};

export const WithoutEffectText: Story = {
    args: { abilities: [{ name: "run-away", isHidden: false, effect: "" }] },
    play: async ({ canvasElement }) => {
        const item = within(canvasElement).getByRole("listitem");
        await expect(item).toHaveTextContent("Run Away");
        await expect(item.querySelectorAll("span")).toHaveLength(1);
    },
};
