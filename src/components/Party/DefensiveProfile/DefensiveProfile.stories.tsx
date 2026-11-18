import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
    bulbasaur,
    CHARMANDER,
    DRATINI,
    EFFICACY,
    PIDGEY,
} from "../../__fixtures__/pokemon";
import DefensiveProfile from ".";

const meta = {
    title: "Party/DefensiveProfile",
    component: DefensiveProfile,
    args: { party: [bulbasaur, CHARMANDER, PIDGEY], efficacy: EFFICACY },
    decorators: [
        (Story) => (
            <div className="max-w-3xl bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof DefensiveProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedParty: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const weak = canvas.getByRole("region", { name: "Weak" });
        // bulbasaur and pidgey are both weak to ice
        await expect(
            within(weak).getByText("2 members weak to ice")
        ).toBeInTheDocument();
        // pidgey is immune to ground, but charmander's weakness still shows
        await expect(
            within(weak).getByText("1 member weak to ground")
        ).toBeInTheDocument();
    },
};

export const EmptyParty: Story = {
    args: { party: [] },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText(
                "Add Pokémon to see the defensive profile"
            )
        ).toBeVisible();
    },
};

export const MissingTypeData: Story = {
    args: { party: [bulbasaur, DRATINI] },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText("Type data unavailable for", {
                exact: false,
            })
        ).toHaveTextContent("dratini");
    },
};
