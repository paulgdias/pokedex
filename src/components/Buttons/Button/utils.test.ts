import { describe, expect, it } from "vitest";

import { buttonClass } from "./utils";

describe("buttonClass", () => {
    it("defaults to a medium secondary button", () => {
        const classes = buttonClass().split(" ");
        expect(classes).toContain("h-10");
        expect(classes).toContain("bg-surface");
        expect(classes).toContain("hover:bg-chip");
    });

    it.each([
        ["primary", "bg-ink"],
        ["secondary", "bg-surface"],
        ["ghost", "text-muted"],
        ["link", "text-accent"],
        ["field", "bg-paper"],
    ] as const)("%s has its own look", (variant, expected) => {
        expect(buttonClass({ variant }).split(" ")).toContain(expected);
    });

    it.each([
        ["sm", "h-8"],
        ["md", "h-10"],
        ["lg", "h-11"],
    ] as const)("%s sets the height", (size, expected) => {
        expect(buttonClass({ size }).split(" ")).toContain(expected);
    });

    it("makes an icon button square instead of padded", () => {
        const classes = buttonClass({ size: "sm", icon: true }).split(" ");
        expect(classes).toContain("size-8");
        expect(classes).not.toContain("px-3");
    });

    it("lets a variant override the size's radius and padding", () => {
        expect(buttonClass({ variant: "field" }).split(" ")).toContain(
            "rounded-xl"
        );
        expect(buttonClass({ variant: "field" }).split(" ")).not.toContain(
            "rounded-[10px]"
        );
        expect(buttonClass({ variant: "link" }).split(" ")).toContain("px-2");
        expect(buttonClass({ variant: "link" }).split(" ")).not.toContain(
            "px-3"
        );
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

    it("dims and blocks a disabled button", () => {
        const classes = buttonClass().split(" ");
        expect(classes).toContain("disabled:opacity-50");
        expect(classes).toContain("disabled:cursor-not-allowed");
    });
});
