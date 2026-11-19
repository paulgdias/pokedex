import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { STAT_LABELS } from "@utils/stats";

import StatBars from ".";

// the total and the bar lengths, capped at the maximum, are covered by the
// stories
describe("StatBars", () => {
    it("gives each stat its own labelled meter, in order", async () => {
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
    });

    it("treats missing stats as zero", async () => {
        const screen = await render(<StatBars stats={[10]} total={10} />);
        await expect
            .element(screen.getByRole("meter", { name: "Speed" }))
            .toHaveAttribute("aria-valuenow", "0");
    });
});
