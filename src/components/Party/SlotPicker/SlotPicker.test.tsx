import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { DEX, makePokemon } from "../../__fixtures__/pokemon";
import SlotPicker from ".";

const setup = async (excludedIds: number[] = []) => {
    const onSelect = vi.fn();
    const screen = await render(
        <SlotPicker
            index={2}
            allPokemon={DEX}
            excludedIds={excludedIds}
            onSelect={onSelect}
        />
    );
    const input = screen.getByRole("combobox", { name: "Slot 3 Pokémon" });
    return { screen, input, onSelect };
};

const optionNames = (screen: Awaited<ReturnType<typeof render>>) =>
    screen
        .getByRole("option")
        .elements()
        .map((option) => option.textContent);

describe("SlotPicker", () => {
    // the label, the matches and the cleared text are covered by the stories
    it("leaves out Pokémon already in the party", async () => {
        const { screen, input } = await setup([1, 3]);
        await input.fill("saur");
        expect(optionNames(screen)).toEqual(["#0002ivysaur"]);
    });

    it("offers at most eight matches", async () => {
        const many = Array.from({ length: 12 }, (_, index) =>
            makePokemon({ id: 500 + index, name: `mon-${index}` })
        );
        const screen = await render(
            <SlotPicker
                index={0}
                allPokemon={many}
                excludedIds={[]}
                onSelect={vi.fn()}
            />
        );
        await screen.getByRole("combobox").fill("mon");
        await expect.element(screen.getByRole("option").first()).toBeVisible();
        expect(optionNames(screen)).toHaveLength(8);
    });

    it("reports the pick", async () => {
        const { screen, input, onSelect } = await setup();
        await input.fill("char");
        await screen.getByRole("option", { name: /charmander/ }).click();
        expect(onSelect).toHaveBeenCalledWith(4);
    });

    it("says when nothing matches", async () => {
        const { screen, input } = await setup();
        await input.fill("zzz");
        await expect.element(screen.getByText("No matches")).toBeVisible();
    });

    it("asks for text when opened empty", async () => {
        const { screen, input } = await setup();
        await input.click();
        await userEvent.keyboard("{ArrowDown}");
        await expect
            .element(screen.getByText("Start typing a name or number"))
            .toBeVisible();
    });
});
