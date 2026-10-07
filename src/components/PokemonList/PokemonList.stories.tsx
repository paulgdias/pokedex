import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { makeDex } from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";
import PokemonList from ".";

const meta = {
    title: "Pokedex/PokemonList",
    component: PokemonList,
    args: { pokemon: makeDex(60) },
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <TestRouter initialEntries={["/pokedex?q=mon"]}>
                <div className="flex h-[560px] w-[820px] flex-col p-4">
                    <Story />
                </div>
            </TestRouter>
        ),
    ],
} satisfies Meta<typeof PokemonList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VirtualizedGrid: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByLabelText("Pokemon Card for mon-1")
        ).toBeVisible();
        // only what is near the viewport is mounted
        await expect(
            canvas.queryByLabelText("Pokemon Card for mon-60")
        ).toBeNull();

        const grid = canvas.getByRole("grid");
        grid.scrollTop = grid.scrollHeight;
        await waitFor(() =>
            expect(
                canvas.getByLabelText("Pokemon Card for mon-60")
            ).toBeVisible()
        );

        await userEvent.click(
            canvas.getByRole("button", { name: "Go to Top of Page" })
        );
        await waitFor(() => expect(grid.scrollTop).toBe(0));
        await expect(
            await canvas.findByLabelText("Pokemon Card for mon-1")
        ).toBeVisible();
    },
};

export const NavigatesToAPokemon: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            await canvas.findByLabelText("Pokemon Card for mon-2")
        );
        const location = canvas.getByTestId("location");
        await waitFor(() =>
            expect(location).toHaveAttribute("data-pathname", "/pokedex/mon-2")
        );
        // back navigation returns to the same filters
        await expect(location).toHaveAttribute(
            "data-previous",
            "/pokedex?q=mon"
        );
    },
};

export const Loading: Story = {
    args: { pokemon: makeDex(6), isLoading: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() =>
            expect(
                canvasElement.querySelectorAll('[aria-hidden="true"]').length
            ).toBeGreaterThan(0)
        );
        await expect(canvas.queryByLabelText(/Pokemon Card for/)).toBeNull();
    },
};

export const Empty: Story = {
    args: { pokemon: [] },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).queryByRole("grid")).toBeNull();
        await expect(
            within(canvasElement).queryByRole("button", {
                name: "Go to Top of Page",
            })
        ).toBeNull();
    },
};

export const WithoutScrollButton: Story = {
    args: { scrollToPosition: false },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByLabelText("Pokemon Card for mon-1");
        await expect(
            canvas.queryByRole("button", { name: "Go to Top of Page" })
        ).toBeNull();
    },
};
