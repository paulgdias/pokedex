import { describe, expect, it } from "vitest";

import { buttonClass } from "./utils";

// what each variant and size looks like is covered by the Button stories;
// this covers the order in which the class groups win
describe("buttonClass", () => {
    it("lets a variant override the size's radius and padding", () => {
        const field = buttonClass({ variant: "field" }).split(" ");
        expect(field).toContain("rounded-xl");
        expect(field).not.toContain("rounded-[10px]");

        const link = buttonClass({ variant: "link" }).split(" ");
        expect(link).toContain("px-2");
        expect(link).not.toContain("px-3");
    });

    it("lets className override any of it", () => {
        const classes = buttonClass({
            variant: "primary",
            className: "rounded-full bg-accent",
        }).split(" ");
        expect(classes).toContain("rounded-full");
        expect(classes).toContain("bg-accent");
        expect(classes).not.toContain("bg-ink");
        expect(classes).not.toContain("rounded-[10px]");
    });
});
