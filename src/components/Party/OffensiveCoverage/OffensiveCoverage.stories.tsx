import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { TYPE_ORDER } from "@utils/stats";

import {
    bulbasaur,
    CHARMANDER,
    DITTO,
    EFFICACY,
} from "../../__fixtures__/pokemon";
import OffensiveCoverage from ".";

const meta = {
    title: "Party/OffensiveCoverage",
    component: OffensiveCoverage,
    args: { party: [bulbasaur, CHARMANDER], efficacy: EFFICACY },
    decorators: [
        (Story) => (
            <div className="max-w-3xl bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof OffensiveCoverage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithGaps: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole("listitem")).toHaveLength(18);
        // grass hits water, fire hits grass and ice: 15 types left uncovered
        await expect(canvas.getAllByText("Coverage gap")).toHaveLength(15);
    },
};

export const FullCoverage: Story = {
    args: {
        party: [DITTO],
        efficacy: {
            normal: Object.fromEntries(TYPE_ORDER.map((type) => [type, 2])),
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByText("Full coverage", { exact: false })
        ).toBeVisible();
        await expect(canvas.queryByText("Coverage gap")).toBeNull();
    },
};

export const EmptyParty: Story = {
    args: { party: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByText("Add Pokémon", { exact: false })
        ).toBeVisible();
        await expect(canvas.queryAllByRole("listitem")).toHaveLength(0);
    },
};
