import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import ScrollTopButton from ".";

// keyboard activation is Button's contract (Button stories)
describe("ScrollTopButton", () => {
    it("calls onPress once per press", async () => {
        const onPress = vi.fn();
        const screen = await render(<ScrollTopButton onPress={onPress} />);
        await screen.getByRole("button", { name: "Go to Top of Page" }).click();
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
