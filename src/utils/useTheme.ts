import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

const isPreference = (value: unknown): value is ThemePreference =>
    value === "light" || value === "dark" || value === "system";

const readPreference = (): ThemePreference => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (isPreference(saved)) {
            return saved;
        }
    } catch {
        // storage can be blocked; fall back to the system setting
    }
    return "system";
};

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)");

const resolve = (preference: ThemePreference): ResolvedTheme =>
    preference === "system"
        ? prefersDark().matches
            ? "dark"
            : "light"
        : preference;

const notify = () => listeners.forEach((listener) => listener());

const apply = () => {
    document.documentElement.dataset.theme = resolve(readPreference());
    notify();
};

/** Follows OS changes while the preference is "system". Call once at startup. */
export const initTheme = () => {
    apply();
    prefersDark().addEventListener("change", () => {
        if (readPreference() === "system") {
            apply();
        }
    });
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useTheme = () => {
    const preference = useSyncExternalStore(subscribe, readPreference);
    const resolved = useSyncExternalStore(
        subscribe,
        () => document.documentElement.dataset.theme as ResolvedTheme
    );

    const setPreference = (next: ThemePreference) => {
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // the choice still applies for this session
        }
        apply();
    };

    return { preference, resolved, setPreference };
};
