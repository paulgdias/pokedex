import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import ScrollTopButton from ".";

describe("ScrollTopButton", () => {
    it("is a button named for its action", async () => {
        const screen = await render(<ScrollTopButton onPress={vi.fn()} />);
        await expect
            .element(screen.getByRole("button", { name: "Go to Top of Page" }))
            .toBeVisible();
    });

    it("calls onPress once per press", async () => {
        const onPress = vi.fn();
        const screen = await render(<ScrollTopButton onPress={onPress} />);
        await screen.getByRole("button").click();
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
