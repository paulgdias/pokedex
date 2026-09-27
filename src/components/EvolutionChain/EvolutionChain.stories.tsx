import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import EvolutionChain from ".";
import {
    DITTO,
    EEVEE_LINE,
    MEOWTH_LINE,
    ivysaur,
    venusaur,
    venusaurMega,
} from "../__fixtures__/pokemon";
import TestRouter from "../__fixtures__/router";

const meta = {
    title: "PokemonDetail/EvolutionChain",
    component: EvolutionChain,
    args: { pokemon: ivysaur },
    decorators: [
        (Story) => (
            <TestRouter initialEntries={["/pokedex/ivysaur?view=list"]}>
                <Story />
            </TestRouter>
        ),
    ],
    parameters: { layout: "padded" },
} satisfies Meta<typeof EvolutionChain>;

export default meta;
type Story = StoryObj<typeof meta>;

const location = (canvasElement: HTMLElement) =>
    within(canvasElement).getByTestId("location");

export const ThreeStageLine: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("heading", { name: "Evolution chain" })
        ).toBeVisible();

        // the current pokémon is marked and not a link
        const current = canvasElement.querySelector('[aria-current="page"]');
        await expect(current).toHaveTextContent("ivysaur");
        await expect(
            canvas.queryByRole("link", { name: /ivysaur/ })
        ).toBeNull();

        await expect(canvas.getByText("Lv. 16")).toBeVisible();
        await expect(canvas.getByText("Lv. 32")).toBeVisible();
        await expect(canvas.getByText("Mega Venusaur")).toBeVisible();
        await expect(canvas.getByText("Gigantamax Venusaur")).toBeVisible();

        // picking another stage goes to its page and remembers where we were
        await userEvent.click(
            canvas.getByRole("link", { name: /venusaur #0003/ })
        );
        await waitFor(() =>
            expect(location(canvasElement)).toHaveAttribute(
                "data-pathname",
                "/pokedex/venusaur"
            )
        );
        await expect(location(canvasElement)).toHaveAttribute(
            "data-previous",
            "/pokedex/ivysaur?view=list"
        );
        await expect(location(canvasElement)).toHaveAttribute(
            "data-pokemon",
            "venusaur"
        );
    },
};

export const OtherForms: Story = {
    args: { pokemon: venusaurMega },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const current = canvasElement.querySelector('[aria-current="page"]');
        await expect(current).toHaveTextContent("Mega Venusaur");

        await userEvent.click(
            canvas.getByRole("link", { name: /Gigantamax Venusaur/ })
        );
        await waitFor(() =>
            expect(location(canvasElement)).toHaveAttribute(
                "data-pathname",
                "/pokedex/venusaur-gmax"
            )
        );
    },
};

export const BranchingEvolutions: Story = {
    args: { pokemon: EEVEE_LINE[0] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Use Water Stone")).toBeVisible();
        await expect(canvas.getByText("Use Thunder Stone")).toBeVisible();
        await expect(
            canvas.getByRole("link", { name: /vaporeon/ })
        ).toBeVisible();
        await expect(
            canvas.getByRole("link", { name: /jolteon/ })
        ).toBeVisible();
    },
};

export const RegionalLanes: Story = {
    args: { pokemon: MEOWTH_LINE[0] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const headings = canvas
            .getAllByRole("heading", { level: 3 })
            .map((heading) => heading.textContent);
        await expect(headings).toEqual(["Standard", "Alola", "Galar"]);
        await expect(canvas.getByText("High friendship")).toBeVisible();
    },
};

export const NoEvolutions: Story = {
    args: { pokemon: { ...DITTO, evolutions: [DITTO] } },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).queryByRole("heading", {
                name: "Evolution chain",
            })
        ).toBeNull();
    },
};

export const ExplicitPrevious: Story = {
    args: { pokemon: { ...venusaur }, previous: "/pokedex?q=saur" },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("link", { name: /ivysaur/ }));
        await waitFor(() =>
            expect(location(canvasElement)).toHaveAttribute(
                "data-previous",
                "/pokedex?q=saur"
            )
        );
    },
};
