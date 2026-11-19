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
        const bands = canvas
            .getAllByRole("heading", { level: 3 })
            .map((heading) => heading.textContent);
        await expect(bands).toEqual(["Immune", "Resistant", "Neutral", "Weak"]);
        // nothing lands in Immune: pidgey's ground immunity is outranked
        await expect(
            within(canvas.getByRole("region", { name: "Immune" })).getByText(
                "No types in this band"
            )
        ).toBeVisible();
        const weak = canvas.getByRole("region", { name: "Weak" });
        // bulbasaur and pidgey are both weak to ice
        const ice = within(weak).getByText("2 members weak to ice");
        // sighted users read the count from the badge on the pill
        const badge = ice.closest("li")?.querySelector("[aria-hidden]");
        await expect(badge).toBeVisible();
        await expect(badge).toHaveTextContent("2");
        // pidgey is immune to ground, but charmander's weakness still shows
        await expect(
            within(weak).getByText("1 member weak to ground")
        ).toBeInTheDocument();
    },
};

export const EmptyParty: Story = {
    args: { party: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByText("Add Pokémon to see the defensive profile")
        ).toBeVisible();
        await expect(canvas.queryAllByRole("heading", { level: 3 })).toEqual(
            []
        );
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
