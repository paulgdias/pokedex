import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { initTheme, useTheme } from ".";

type Listener = () => void;

/** A controllable prefers-color-scheme: dark. */
const mockSystemTheme = (initiallyDark: boolean) => {
    let dark = initiallyDark;
    const listeners = new Set<Listener>();
    vi.spyOn(window, "matchMedia").mockImplementation(
        () =>
            ({
                get matches() {
                    return dark;
                },
                addEventListener: (_: string, listener: Listener) =>
                    listeners.add(listener),
                removeEventListener: (_: string, listener: Listener) =>
                    listeners.delete(listener),
            }) as unknown as MediaQueryList
    );
    return {
        set(next: boolean) {
            dark = next;
            for (const listener of listeners) {
                listener();
            }
        },
    };
};

const theme = () => document.documentElement.dataset.theme;

beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
});
afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});

describe("initTheme", () => {
    it("follows the system when nothing is saved", () => {
        mockSystemTheme(true);
        initTheme();
        expect(theme()).toBe("dark");
    });

    it("uses a saved choice over the system", () => {
        mockSystemTheme(true);
        localStorage.setItem("theme", "light");
        initTheme();
        expect(theme()).toBe("light");
    });

    it("tracks OS changes while the preference is system", () => {
        const system = mockSystemTheme(false);
        initTheme();
        expect(theme()).toBe("light");

        system.set(true);
        expect(theme()).toBe("dark");
        system.set(false);
        expect(theme()).toBe("light");
    });

    it("ignores OS changes once the user has chosen", () => {
        const system = mockSystemTheme(false);
        initTheme();
        localStorage.setItem("theme", "light");

        system.set(true);

        expect(theme()).toBe("light");
    });

    it("falls back to system when storage is blocked", () => {
        mockSystemTheme(true);
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        initTheme();
        expect(theme()).toBe("dark");
    });
});

describe("useTheme", () => {
    it("reports the saved preference and the resolved theme", async () => {
        mockSystemTheme(false);
        localStorage.setItem("theme", "dark");
        document.documentElement.dataset.theme = "dark";

        const { result } = await renderHook(() => useTheme());

        expect(result.current.preference).toBe("dark");
        expect(result.current.resolved).toBe("dark");
    });

    it("defaults to the system preference", async () => {
        mockSystemTheme(false);
        const { result } = await renderHook(() => useTheme());
        expect(result.current.preference).toBe("system");
    });

    it("ignores an invalid saved value", async () => {
        mockSystemTheme(false);
        localStorage.setItem("theme", "neon");
        const { result } = await renderHook(() => useTheme());
        expect(result.current.preference).toBe("system");
    });

    it("saves a new preference, applies it and updates subscribers", async () => {
        mockSystemTheme(false);
        const { result, act } = await renderHook(() => useTheme());

        await act(() => result.current.setPreference("dark"));

        expect(localStorage.getItem("theme")).toBe("dark");
        expect(theme()).toBe("dark");
        expect(result.current.preference).toBe("dark");
        expect(result.current.resolved).toBe("dark");
    });

    it("resolves 'system' from the OS", async () => {
        mockSystemTheme(true);
        const { result, act } = await renderHook(() => useTheme());

        await act(() => result.current.setPreference("system"));

        expect(result.current.preference).toBe("system");
        expect(result.current.resolved).toBe("dark");
    });

    it("keeps working for the session when storage is blocked", async () => {
        mockSystemTheme(false);
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        const { result, act } = await renderHook(() => useTheme());

        await act(() => result.current.setPreference("dark"));

        // nothing saved, so the theme resolves from the system again
        expect(localStorage.getItem("theme")).toBeNull();
        expect(theme()).toBe("light");
    });

    it("shares changes between hook instances", async () => {
        mockSystemTheme(false);
        const first = await renderHook(() => useTheme());
        const second = await renderHook(() => useTheme());

        await first.act(() => first.result.current.setPreference("dark"));

        expect(second.result.current.preference).toBe("dark");
    });
});
