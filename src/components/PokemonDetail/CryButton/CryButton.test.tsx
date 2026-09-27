import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import CryButton from ".";

class FakeAudio {
    static instances: FakeAudio[] = [];
    static playFails = false;
    currentTime = 5;
    listeners: Record<string, () => void> = {};
    play = vi.fn(() =>
        FakeAudio.playFails
            ? Promise.reject(new Error("blocked"))
            : Promise.resolve()
    );
    pause = vi.fn();
    constructor(public src: string) {
        FakeAudio.instances.push(this);
    }
    addEventListener(name: string, listener: () => void) {
        this.listeners[name] = listener;
    }
}

const button = (screen: Awaited<ReturnType<typeof render>>) =>
    screen.getByRole("button", { name: "Play mew's cry" });

describe("CryButton", () => {
    beforeEach(() => {
        FakeAudio.instances = [];
        FakeAudio.playFails = false;
        vi.stubGlobal("Audio", FakeAudio);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("is disabled without a cry and never creates audio", async () => {
        const screen = await render(<CryButton url={null} name="mew" />);
        await expect.element(button(screen)).toBeDisabled();
        expect(FakeAudio.instances).toHaveLength(0);
    });

    it("plays the cry from the start and highlights itself", async () => {
        const screen = await render(<CryButton url="mew.ogg" name="mew" />);

        await button(screen).click();

        const [audio] = FakeAudio.instances;
        expect(audio.src).toBe("mew.ogg");
        expect(audio.currentTime).toBe(0);
        expect(audio.play).toHaveBeenCalledOnce();
        await expect.element(button(screen)).toHaveClass("text-accent");
    });

    it("reuses one audio element and restarts it on every press", async () => {
        const screen = await render(<CryButton url="mew.ogg" name="mew" />);

        await button(screen).click();
        FakeAudio.instances[0].currentTime = 3;
        await button(screen).click();

        expect(FakeAudio.instances).toHaveLength(1);
        expect(FakeAudio.instances[0].currentTime).toBe(0);
        expect(FakeAudio.instances[0].play).toHaveBeenCalledTimes(2);
    });

    it("stops highlighting when the cry ends", async () => {
        const screen = await render(<CryButton url="mew.ogg" name="mew" />);
        await button(screen).click();

        FakeAudio.instances[0].listeners.ended();

        await expect.element(button(screen)).not.toHaveClass("text-accent");
    });

    it("stops highlighting when the browser refuses to play", async () => {
        FakeAudio.playFails = true;
        const screen = await render(<CryButton url="mew.ogg" name="mew" />);

        await button(screen).click();

        await expect.element(button(screen)).not.toHaveClass("text-accent");
    });

    it("pauses the old cry when the url changes and plays the new one", async () => {
        const screen = await render(<CryButton url="a.ogg" name="mew" />);
        await button(screen).click();

        await screen.rerender(<CryButton url="b.ogg" name="mew" />);
        expect(FakeAudio.instances[0].pause).toHaveBeenCalledOnce();
        await expect.element(button(screen)).not.toHaveClass("text-accent");

        await button(screen).click();
        expect(FakeAudio.instances).toHaveLength(2);
        expect(FakeAudio.instances[1].src).toBe("b.ogg");
    });

    it("pauses on unmount", async () => {
        const screen = await render(<CryButton url="a.ogg" name="mew" />);
        await button(screen).click();

        await screen.unmount();

        expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
    });
});
