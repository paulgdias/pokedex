import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import PlaceholderCard from ".";

const card = (screen: Awaited<ReturnType<typeof render>>) =>
    screen.container.firstElementChild as HTMLElement;

describe("PlaceholderCard", () => {
    it("is hidden from assistive tech", async () => {
        const screen = await render(<PlaceholderCard />);
        expect(card(screen).getAttribute("aria-hidden")).toBe("true");
    });

    it("only pulses when animated", async () => {
        const still = await render(<PlaceholderCard />);
        expect(card(still).classList.contains("animate-pulse")).toBe(false);
        await still.unmount();

        const pulsing = await render(<PlaceholderCard animated />);
        expect(card(pulsing).classList.contains("animate-pulse")).toBe(true);
    });

    it("applies style and lets className override the card classes", async () => {
        const screen = await render(
            <PlaceholderCard
                style={{ width: 123 }}
                className="rounded-none border-red-500"
            />
        );
        const element = card(screen);
        expect(element.style.width).toBe("123px");
        expect(element.classList.contains("border-red-500")).toBe(true);
    });
});
