import type { Reporter, TestModule } from "vitest/node";

type A11yMeta = { score: number; passes: number; violations: string[] };

/** Prints each story's axe score, worst first, after the run. */
export default class A11yReporter implements Reporter {
    onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
        const rows: { name: string; meta: A11yMeta }[] = [];
        for (const module of testModules) {
            for (const test of module.children.allTests()) {
                const meta = test.meta() as { a11y?: A11yMeta };
                if (meta.a11y) {
                    rows.push({
                        name: `[${module.project.name}] ${module.moduleId.split("/src/components/")[1]} > ${test.name}`,
                        meta: meta.a11y,
                    });
                }
            }
        }
        if (rows.length === 0) {
            return;
        }
        rows.sort((a, b) => a.meta.score - b.meta.score);
        console.info("\nAccessibility (axe) score per story, worst first:");
        for (const { name, meta } of rows) {
            const found = meta.violations.length
                ? `  violations: ${meta.violations.join(", ")}`
                : "";
            console.info(
                `  ${(meta.score * 100).toFixed(0).padStart(3)}%  ${name}${found}`
            );
        }
    }
}
