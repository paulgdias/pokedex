import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";

import {
    bulbasaur,
    CHARMANDER,
    EFFICACY,
    PIDGEY,
} from "../../__fixtures__/pokemon";
import ThreatAnalysis from ".";

const meta = {
    title: "Party/ThreatAnalysis",
    component: ThreatAnalysis,
    args: {
        party: [bulbasaur, CHARMANDER, PIDGEY],
        threats: ["fire", "ground"],
        efficacy: EFFICACY,
        onAddThreat: fn(),
        onRemoveThreat: fn(),
    },
    // room for the type list
    decorators: [
        (Story) => (
            <div className="min-h-96 max-w-3xl bg-paper p-6">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ThreatAnalysis>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const table = canvas.getByRole("table");
        await expect(within(table).getAllByRole("row")).toHaveLength(4);
        // pidgey's flying type makes it immune to ground
        await expect(
            within(table).getByText("Ground → Pidgey: 0× (no effect)")
        ).toBeInTheDocument();
        // cells are shaded by outcome: weak, immune, resistant and neutral all differ
        const fill = (multiplier: string) => {
            const cell = table.querySelector(
                `td[data-multiplier="${multiplier}"]`
            );
            return cell ? getComputedStyle(cell).backgroundColor : "";
        };
        // an immunity is inverted (light text on a solid fill)
        const textColor = (multiplier: string) => {
            const cell = table.querySelector(
                `td[data-multiplier="${multiplier}"]`
            );
            return cell ? getComputedStyle(cell).color : "";
        };
        await expect(textColor("0")).not.toBe(textColor("0.5"));
        const fills = [fill("2"), fill("0"), fill("1"), fill("0.5")];
        await expect(new Set(fills).size).toBe(4);
    },
};

/** Threats kept in local state, as the page keeps them in the URL. */
export const AddAndRemove: Story = {
    args: { threats: [] },
    render: (args) => {
        const [threats, setThreats] = useState<string[]>(args.threats);
        return (
            <ThreatAnalysis
                {...args}
                threats={threats}
                onAddThreat={(type) => {
                    setThreats((current) => [...current, type]);
                    args.onAddThreat(type);
                }}
                onRemoveThreat={(type) => {
                    setThreats((current) => current.filter((t) => t !== type));
                    args.onRemoveThreat(type);
                }}
            />
        );
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const picker = canvas.getByRole("button", {
            name: /Add a threat type/,
        });
        for (const type of ["water", "ice", "electric"]) {
            await userEvent.click(picker);
            // the list is portalled outside the canvas
            await userEvent.click(
                await screen.findByRole("option", { name: type })
            );
        }
        await expect(args.onAddThreat).toHaveBeenCalledTimes(3);
        await expect(picker).toBeDisabled();
        await expect(canvas.getByRole("table")).toBeVisible();

        await userEvent.click(
            canvas.getByRole("button", { name: "Remove ice threat" })
        );
        await expect(args.onRemoveThreat).toHaveBeenCalledWith("ice");
        await expect(picker).toBeEnabled();
    },
};

export const Empty: Story = {
    args: { party: [], threats: [] },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText("Pick up to three opponent types", {
                exact: false,
            })
        ).toBeVisible();
    },
};
