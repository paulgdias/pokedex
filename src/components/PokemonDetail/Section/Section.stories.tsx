import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { makeInfo } from "../../__fixtures__/pokemon";
import Section, { InfoSection } from ".";

const meta = {
    title: "PokemonDetail/Section",
    component: Section,
    args: { title: "Abilities", children: <p>Overgrow</p> },
    decorators: [
        (Story) => (
            <div className="w-96">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Titled: Story = {
    play: async ({ canvasElement }) => {
        const region = within(canvasElement).getByRole("region", {
            name: "Abilities",
        });
        await expect(region).toBeVisible();
        await expect(
            within(region).getByRole("heading", { level: 2 })
        ).toHaveTextContent("Abilities");
        await expect(within(region).getByText("Overgrow")).toBeVisible();
    },
};

export const InfoLoading: Story = {
    render: () => (
        <InfoSection title="Facts" query={{ isError: false }}>
            {(info) => <p>{info.genus}</p>}
        </InfoSection>
    ),
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByLabelText("Loading")
        ).toHaveAttribute("aria-busy", "true");
    },
};

export const InfoError: Story = {
    render: () => (
        <InfoSection title="Facts" query={{ isError: true }}>
            {(info) => <p>{info.genus}</p>}
        </InfoSection>
    ),
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText("Couldn’t load this section.")
        ).toBeVisible();
        await expect(
            within(canvasElement).queryByLabelText("Loading")
        ).toBeNull();
    },
};

export const InfoLoaded: Story = {
    render: () => (
        <InfoSection title="Facts" query={{ isError: false, data: makeInfo() }}>
            {(info) => <p>{info.genus}</p>}
        </InfoSection>
    ),
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText("Seed Pokémon")
        ).toBeVisible();
        await expect(
            within(canvasElement).queryByLabelText("Loading")
        ).toBeNull();
    },
};
