import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import Nav from ".";
import { DEX } from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";

const meta = {
    title: "Layout/Nav",
    component: Nav,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story, { parameters }) => (
            <TestRouter
                initialEntries={parameters.entries ?? ["/pokedex?type=fire"]}
                dex={DEX}
            >
                <div className="flex min-h-[640px] flex-col lg:flex-row">
                    <Story />
                </div>
            </TestRouter>
        ),
    ],
} satisfies Meta<typeof Nav>;

export default meta;
type Story = StoryObj<typeof meta>;

// the sidebar and the top bar are both in the DOM; CSS shows one of them
const links = (canvas: ReturnType<typeof within>, name: string) =>
    canvas.getAllByRole("link", { name, hidden: true });

export const MarksTheCurrentPage: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findAllByRole("link", { name: "Pokédex", hidden: true });

        for (const link of links(canvas, "Pokédex")) {
            await expect(link).toHaveAttribute("aria-current", "page");
            // the filters stay on the link to the page you are on
            await expect(link).toHaveAttribute("href", "/pokedex?type=fire");
        }
        for (const link of links(canvas, "Compare")) {
            await expect(link).not.toHaveAttribute("aria-current");
            await expect(link).toHaveAttribute("href", "/compare");
        }
    },
};

export const GenerationsWithCounts: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const kanto = await canvas.findByRole("link", {
            name: /Kanto/,
            hidden: true,
        });
        await expect(kanto).toHaveTextContent("8");
        await expect(
            canvas.getByRole("link", { name: /Every region/, hidden: true })
        ).toHaveTextContent("10");
        await expect(
            canvas.getByRole("link", { name: /Every region/, hidden: true })
        ).toHaveAttribute("aria-current", "true");

        await userEvent.click(
            canvas.getByRole("link", { name: /Johto/, hidden: true })
        );
        await waitFor(() =>
            expect(canvas.getByTestId("location")).toHaveAttribute(
                "data-search",
                "?type=fire&gen=2"
            )
        );
        await expect(
            canvas.getByRole("link", { name: /Johto/, hidden: true })
        ).toHaveAttribute("aria-current", "true");
    },
};

export const OnAPokemonPage: Story = {
    parameters: { entries: ["/pokedex/bulbasaur"] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const kanto = await canvas.findByRole("link", {
            name: /Kanto/,
            hidden: true,
        });
        // filters do not apply to a single pokémon's page
        await expect(kanto).not.toHaveAttribute("aria-current");
        await expect(kanto).toHaveTextContent("8");
    },
};

export const OutsideThePokedex: Story = {
    parameters: { entries: ["/compare"] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findAllByRole("link", { name: "Compare", hidden: true });
        await expect(canvas.queryByText("Generations")).toBeNull();
        for (const link of links(canvas, "Compare")) {
            await expect(link).toHaveAttribute("aria-current", "page");
        }
    },
};
