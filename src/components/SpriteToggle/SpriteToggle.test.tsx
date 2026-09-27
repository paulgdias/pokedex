import { useState } from "react";

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import SpriteToggle, { SpriteView } from ".";

const Harness = ({
    isInGameAvailable = true,
    onChange,
}: {
    isInGameAvailable?: boolean;
    onChange: (value: SpriteView) => void;
}) => {
    const [value, setValue] = useState<SpriteView>("artwork");
    return (
        <SpriteToggle
            value={value}
            isInGameAvailable={isInGameAvailable}
            onChange={(next) => {
                setValue(next);
                onChange(next);
            }}
        />
    );
};

describe("SpriteToggle", () => {
    it("reflects the value it is given", async () => {
        const screen = await render(
            <SpriteToggle
                value="in-game"
                isInGameAvailable
                onChange={vi.fn()}
            />
        );
        await expect
            .element(screen.getByRole("radio", { name: "In-Game" }))
            .toBeChecked();
        await expect
            .element(screen.getByRole("radio", { name: "Artwork" }))
            .not.toBeChecked();
    });

    it("reports the chosen view and moves the selection", async () => {
        const onChange = vi.fn();
        const screen = await render(<Harness onChange={onChange} />);

        await screen.getByRole("radio", { name: "In-Game" }).click();

        expect(onChange).toHaveBeenCalledExactlyOnceWith("in-game");
        await expect
            .element(screen.getByRole("radio", { name: "In-Game" }))
            .toBeChecked();
    });

    it("can be driven from the keyboard", async () => {
        const onChange = vi.fn();
        const screen = await render(<Harness onChange={onChange} />);

        (
            screen
                .getByRole("radio", { name: "In-Game" })
                .element() as HTMLElement
        ).focus();
        await userEvent.keyboard("{Enter}");

        expect(onChange).toHaveBeenLastCalledWith("in-game");
    });

    it("keeps the current view when the selected option is pressed again", async () => {
        const onChange = vi.fn();
        const screen = await render(<Harness onChange={onChange} />);

        await screen.getByRole("radio", { name: "Artwork" }).click();

        await expect
            .element(screen.getByRole("radio", { name: "Artwork" }))
            .toBeChecked();
    });

    it("disables In-Game when the pokémon has no in-game sprite", async () => {
        const onChange = vi.fn();
        const screen = await render(
            <Harness isInGameAvailable={false} onChange={onChange} />
        );

        await expect
            .element(screen.getByRole("radio", { name: "In-Game" }))
            .toBeDisabled();
        await expect
            .element(screen.getByRole("radio", { name: "Artwork" }))
            .toBeEnabled();
        expect(onChange).not.toHaveBeenCalled();
    });
});
