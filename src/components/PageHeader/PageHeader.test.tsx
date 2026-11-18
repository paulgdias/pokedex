import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import PageHeader from ".";

describe("PageHeader", () => {
    it("is a plain div, so it adds no landmark, and passes style through", async () => {
        const screen = await render(
            <PageHeader data-testid="h" style={{ background: "red" }} />
        );
        const header = screen.getByTestId("h");
        expect(header.element().tagName).toBe("DIV");
        await expect.element(header).toHaveStyle({ background: "red" });
    });

    it("lets className set the gap and override the padding", async () => {
        const screen = await render(
            <PageHeader data-testid="h" className="gap-4 pt-5 pb-4" />
        );
        const header = screen.getByTestId("h");
        await expect.element(header).toHaveClass("gap-4", "pt-5", "pb-4");
        await expect.element(header).not.toHaveClass("pt-6");
        await expect.element(header).not.toHaveClass("pb-5");
    });
});
