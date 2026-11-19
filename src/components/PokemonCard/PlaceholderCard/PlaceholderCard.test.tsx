import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import PlaceholderCard from ".";

const card = (screen: Awaited<ReturnType<typeof render>>) =>
    screen.container.firstElementChild as HTMLElement;

// hidden from assistive tech and pulsing when animated: the stories
describe("PlaceholderCard", () => {
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
        expect(element.classList.contains("rounded-[28px]")).toBe(false);
    });
});
