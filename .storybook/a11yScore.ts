/** Minimum share of axe rules a story must pass (passes / (passes + violations)). */
export const MIN_A11Y_SCORE = 0.5;

type AxeResult = { passes: unknown[]; violations: unknown[] };

/** Rules that ran and passed, as a 0-1 share of those that passed or failed. */
export const getA11yScore = ({ passes, violations }: AxeResult) => {
    const total = passes.length + violations.length;
    return total === 0 ? 1 : passes.length / total;
};
