import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import CryButton from ".";

/** A real, playable cry: `seconds` of silence as an 8 kHz 8-bit mono wav. */
const silentCry = (seconds: number) => {
    const samples = Math.round(8000 * seconds);
    const view = new DataView(new ArrayBuffer(44 + samples));
    const ascii = (offset: number, text: string) => {
        for (const [i, char] of [...text].entries()) {
            view.setUint8(offset + i, char.charCodeAt(0));
        }
    };
    ascii(0, "RIFF");
    view.setUint32(4, 36 + samples, true);
    ascii(8, "WAVEfmt ");
    view.setUint32(16, 16, true); // format chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, 8000, true); // sample rate
    view.setUint32(28, 8000, true); // byte rate
    view.setUint16(32, 1, true); // block align
    view.setUint16(34, 8, true); // bits per sample
    ascii(36, "data");
    view.setUint32(40, samples, true);
    new Uint8Array(view.buffer, 44).fill(128); // 8-bit silence
    return URL.createObjectURL(new Blob([view.buffer], { type: "audio/wav" }));
};

const button = (screen: Awaited<ReturnType<typeof render>>) =>
    screen.getByRole("button", { name: "Play mew's cry" });

/** Waits until the browser is really playing the audio. */
const playing = (audio: HTMLAudioElement) =>
    expect.poll(() => audio.currentTime).toBeGreaterThan(0);

// the disabled button without a cry and the highlight on press are covered by
// the stories.
// No mocks: the audio elements are real and really play (silent) cries; the
// test only records the ones the button creates.
describe("CryButton", () => {
    let created: HTMLAudioElement[];
    const cries: string[] = [];
    const cry = (seconds = 5) => {
        cries.push(silentCry(seconds));
        return cries[cries.length - 1];
    };

    beforeEach(() => {
        created = [];
        const RealAudio = window.Audio;
        vi.stubGlobal(
            "Audio",
            class extends RealAudio {
                constructor(src?: string) {
                    super(src);
                    created.push(this);
                }
            }
        );
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        for (const url of cries.splice(0)) {
            URL.revokeObjectURL(url);
        }
    });

    it("plays the cry it was given", async () => {
        const url = cry();
        const screen = await render(<CryButton url={url} name="mew" />);

        await button(screen).click();

        expect(created).toHaveLength(1);
        expect(created[0].src).toBe(url);
        await playing(created[0]);
    });

    it("reuses one audio element and restarts it on every press", async () => {
        const screen = await render(<CryButton url={cry()} name="mew" />);
        await button(screen).click();
        const [audio] = created;
        await playing(audio);
        // as if the cry had played for 3 s and stopped
        audio.pause();
        audio.currentTime = 3;

        await button(screen).click();

        expect(created).toHaveLength(1);
        expect(audio.paused).toBe(false);
        expect(audio.currentTime).toBeLessThan(1);
    });

    it("stops highlighting when the cry ends", async () => {
        const screen = await render(<CryButton url={cry(0.3)} name="mew" />);
        await button(screen).click();
        await expect.element(button(screen)).toHaveClass("text-accent");

        await expect.poll(() => created[0].ended).toBe(true);
        await expect.element(button(screen)).not.toHaveClass("text-accent");
    });

    it("stops highlighting when the browser cannot play the cry", async () => {
        // not audio at all, so the browser rejects play()
        const screen = await render(
            <CryButton url="data:audio/wav;base64,AAAA" name="mew" />
        );

        await button(screen).click();

        await expect.element(button(screen)).not.toHaveClass("text-accent");
    });

    it("stops the old cry when the url changes and plays the new one", async () => {
        const otherCry = cry();
        const screen = await render(<CryButton url={cry()} name="mew" />);
        await button(screen).click();
        // play() has settled, so only the url change can clear the highlight
        await playing(created[0]);

        await screen.rerender(<CryButton url={otherCry} name="mew" />);
        expect(created[0].paused).toBe(true);
        await expect.element(button(screen)).not.toHaveClass("text-accent");

        await button(screen).click();
        expect(created).toHaveLength(2);
        expect(created[1].src).toBe(otherCry);
    });

    it("stops the cry on unmount", async () => {
        const screen = await render(<CryButton url={cry()} name="mew" />);
        await button(screen).click();
        await playing(created[0]);

        await screen.unmount();

        expect(created[0].paused).toBe(true);
    });
});
