import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import PageHeader from ".";

describe("PageHeader", () => {
    it("renders its children in a column with the page gutter and a rule", async () => {
        const screen = await render(
            <PageHeader data-testid="h">
                <h1>Compare</h1>
            </PageHeader>
        );
        await expect
            .element(screen.getByRole("heading", { name: "Compare" }))
            .toBeVisible();
        await expect
            .element(screen.getByTestId("h"))
            .toHaveClass(
                "flex",
                "flex-col",
                "border-b",
                "border-line",
                "px-4",
                "lg:px-8"
            );
    });

    it("is a plain div, so it adds no landmark", async () => {
        const screen = await render(<PageHeader data-testid="h" />);
        expect(screen.getByTestId("h").element().tagName).toBe("DIV");
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

    it("passes style through", async () => {
        const screen = await render(
            <PageHeader data-testid="h" style={{ background: "red" }} />
        );
        await expect
            .element(screen.getByTestId("h"))
            .toHaveStyle({ background: "red" });
    });
});
