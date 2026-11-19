import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import Button from ".";

// the looks (variants, sizes, icon mode, disabled dimming) are covered by
// the stories; the class order by utils.test.ts
describe("Button", () => {
    it("calls onPress once per click and once per Enter", async () => {
        const onPress = vi.fn();
        const screen = await render(<Button onPress={onPress}>Save</Button>);
        const button = screen.getByRole("button", { name: "Save" });

        await button.click();
        expect(onPress).toHaveBeenCalledTimes(1);

        (button.element() as HTMLElement).focus();
        await userEvent.keyboard("{Enter}");
        expect(onPress).toHaveBeenCalledTimes(2);
    });

    it("does not call onPress when disabled", async () => {
        const onPress = vi.fn();
        const screen = await render(
            <Button isDisabled onPress={onPress}>
                Save
            </Button>
        );
        const button = screen.getByRole("button");
        await expect.element(button).toBeDisabled();
        await button.click({ force: true });
        expect(onPress).not.toHaveBeenCalled();
    });

    it("is a plain button, so it never submits a form", async () => {
        const screen = await render(<Button>Save</Button>);
        await expect
            .element(screen.getByRole("button"))
            .toHaveAttribute("type", "button");
    });

    it("lets className override the variant", async () => {
        const screen = await render(
            <Button variant="primary" className="bg-accent">
                Go
            </Button>
        );
        const button = screen.getByRole("button");
        await expect.element(button).toHaveClass("bg-accent");
        await expect.element(button).not.toHaveClass("bg-ink");
    });
});
