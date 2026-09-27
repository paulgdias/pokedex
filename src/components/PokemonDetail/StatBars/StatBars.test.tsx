import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { STAT_LABELS } from "@utils/stats";

import StatBars from ".";

describe("StatBars", () => {
    it("shows one labelled meter per stat, in order, plus the total", async () => {
        const screen = await render(
            <StatBars stats={[1, 2, 3, 4, 5, 6]} total={21} />
        );
        const meters = screen.getByRole("meter").elements();
        expect(meters.map((m) => m.getAttribute("aria-label"))).toEqual([
            ...STAT_LABELS,
        ]);
        expect(meters.map((m) => m.getAttribute("aria-valuenow"))).toEqual([
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
        ]);
        await expect.element(screen.getByText("Total")).toBeVisible();
        await expect.element(screen.getByText("21")).toBeVisible();
    });

    it("scales bars against 255 and clamps anything higher", async () => {
        const screen = await render(
            <StatBars stats={[255, 510, 51, 0, 0, 0]} total={816} />
        );
        const width = (name: string) =>
            (
                screen.getByRole("meter", { name }).element()
                    .firstElementChild as HTMLElement
            ).style.width;
        expect(width("HP")).toBe("100%");
        expect(width("Attack")).toBe("100%");
        expect(width("Defense")).toBe("20%");
        expect(width("Speed")).toBe("0%");
    });

    it("treats missing stats as zero", async () => {
        const screen = await render(<StatBars stats={[10]} total={10} />);
        await expect
            .element(screen.getByRole("meter", { name: "Speed" }))
            .toHaveAttribute("aria-valuenow", "0");
    });
});
