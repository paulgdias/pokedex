import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import InfoFacts from ".";
import { makeInfo } from "../../__fixtures__/pokemon";

const meta = {
    title: "PokemonDetail/InfoFacts",
    component: InfoFacts,
    args: { info: makeInfo() },
    decorators: [
        (Story) => (
            <div className="w-96">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof InfoFacts>;

export default meta;
type Story = StoryObj<typeof meta>;

const value = (canvas: ReturnType<typeof within>, label: string) =>
    canvas.getByText(label).nextElementSibling as HTMLElement;

export const Facts: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(value(canvas, "Height")).toHaveTextContent(
            "0.7 m (2′04″)"
        );
        await expect(value(canvas, "Weight")).toHaveTextContent(
            "6.9 kg (15.2 lb)"
        );
        await expect(value(canvas, "Egg groups")).toHaveTextContent(
            "Monster, Plant"
        );
        await expect(value(canvas, "Growth rate")).toHaveTextContent(
            "Medium Slow"
        );
        await expect(value(canvas, "Gender")).toHaveTextContent(
            "12.5% female · 87.5% male"
        );
    },
};

export const Genderless: Story = {
    args: {
        info: makeInfo({
            genderRate: -1,
            baseExperience: null,
            baseHappiness: null,
            habitat: null,
            color: null,
            shape: null,
            growthRate: null,
            eggGroups: [],
        }),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(value(canvas, "Gender")).toHaveTextContent("Genderless");
        for (const label of [
            "Base experience",
            "Base happiness",
            "Habitat",
            "Color",
            "Shape",
            "Growth rate",
            "Egg groups",
        ]) {
            await expect(value(canvas, label)).toHaveTextContent("—");
        }
    },
};
