import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import LoadingSpinner from ".";

// the spinning, full-height look is covered by the story
describe("LoadingSpinner", () => {
    it("is announced as a loading status", async () => {
        const screen = await render(<LoadingSpinner />);
        await expect
            .element(screen.getByRole("status", { name: "Loading" }))
            .toBeInTheDocument();
    });

    it("lets className override the full-height default", async () => {
        const screen = await render(<LoadingSpinner className="h-auto" />);
        const wrapper = screen.getByRole("status").element();

        expect(wrapper).toHaveClass("h-auto");
        expect(wrapper).not.toHaveClass("h-screen");
    });
});
