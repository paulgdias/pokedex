import { afterEach, expect } from "vitest";

import { getA11yScore, MIN_A11Y_SCORE } from "./a11yScore";

type A11yReport = {
    type: string;
    result: { passes?: unknown[]; violations?: unknown[]; error?: unknown };
};

// `@storybook/addon-vitest` puts each story's addon reports on the test's
// meta once the story (and the a11y addon's own axe run) has finished
afterEach(({ task }) => {
    const reports = (task.meta.reports ?? []) as A11yReport[];
    const report = reports.find(({ type }) => type === "a11y");

    expect(report, `${task.name}: the a11y addon did not run`).toBeDefined();

    const { passes, violations, error } = report?.result ?? {};
    expect(error, `${task.name}: axe did not complete`).toBeUndefined();

    const score = getA11yScore({
        passes: passes ?? [],
        violations: violations ?? [],
    });
    // read by `a11yReporter.ts` to print a table at the end of the run
    task.meta.a11y = {
        score,
        passes: passes?.length ?? 0,
        violations: (violations ?? []).map((violation) =>
            String((violation as { id?: string }).id)
        ),
    };
    expect(
        score,
        `${task.name}: accessibility score ${(score * 100).toFixed(0)}%`
    ).toBeGreaterThanOrEqual(MIN_A11Y_SCORE);
});
