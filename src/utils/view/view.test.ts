import { describe, expect, it } from "vitest";

import { getViewFromURLParams, withView } from ".";

describe("view", () => {
    it("reads list from the URL and defaults to cards", () => {
        expect(getViewFromURLParams(new URLSearchParams("view=list"))).toBe(
            "list"
        );
        expect(getViewFromURLParams(new URLSearchParams(""))).toBe("cards");
        expect(getViewFromURLParams(new URLSearchParams("view=grid"))).toBe(
            "cards"
        );
    });

    it("writes list to the URL and drops the param for cards, without touching the input", () => {
        const params = new URLSearchParams("q=a");
        expect(withView(params, "list").toString()).toBe("q=a&view=list");
        expect(params.toString()).toBe("q=a");
        expect(
            withView(new URLSearchParams("view=list&q=a"), "cards").toString()
        ).toBe("q=a");
    });
});
