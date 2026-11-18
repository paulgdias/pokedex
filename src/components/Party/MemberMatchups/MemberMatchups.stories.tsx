import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
    bulbasaur,
    CHARMANDER,
    DRATINI,
    EFFICACY,
    PIDGEY,
} from "../../__fixtures__/pokemon";
import MemberMatchups from ".";

const meta = {
    title: "Party/MemberMatchups",
    component: MemberMatchups,
    args: {
        party: [bulbasaur, CHARMANDER, PIDGEY, DRATINI],
        efficacy: EFFICACY,
    },
    decorators: [
        (Story) => (
            <div className="max-w-5xl bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MemberMatchups>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const pidgey = canvas.getByRole("region", { name: "pidgey matchups" });
        // flying makes pidgey immune to ground
        await expect(within(pidgey).getByText("0×")).toBeVisible();
        // the fixture chart never mentions dragon
        await expect(canvas.getByText("Type data unavailable")).toBeVisible();
    },
};
