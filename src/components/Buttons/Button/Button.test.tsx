import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import Button from ".";

describe("Button", () => {
    it("renders its children as a button", async () => {
        const screen = await render(<Button>Save</Button>);
        await expect
            .element(screen.getByRole("button", { name: "Save" }))
            .toBeVisible();
    });

    it("calls onPress once per click", async () => {
        const onPress = vi.fn();
        const screen = await render(<Button onPress={onPress}>Save</Button>);
        await screen.getByRole("button").click();
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("does not call onPress when disabled", async () => {
        const onPress = vi.fn();
        const screen = await render(
            <Button isDisabled onPress={onPress}>
                Save
            </Button>
        );
        await expect.element(screen.getByRole("button")).toBeDisabled();
        expect(onPress).not.toHaveBeenCalled();
    });

    it("is a plain button, so it never submits a form", async () => {
        const screen = await render(<Button>Save</Button>);
        await expect
            .element(screen.getByRole("button"))
            .toHaveAttribute("type", "button");
    });

    it("applies the variant, the size and the icon mode", async () => {
        const screen = await render(
            <>
                <Button variant="primary" size="lg">
                    Go
                </Button>
                <Button icon size="sm" aria-label="Close" />
            </>
        );
        await expect
            .element(screen.getByRole("button", { name: "Go" }))
            .toHaveClass("bg-ink", "h-11");
        await expect
            .element(screen.getByRole("button", { name: "Close" }))
            .toHaveClass("size-8");
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

    it("passes aria attributes through", async () => {
        const screen = await render(
            <Button aria-label="Remove Bulbasaur" icon />
        );
        await expect
            .element(screen.getByRole("button", { name: "Remove Bulbasaur" }))
            .toBeVisible();
    });
});
