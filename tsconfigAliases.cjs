// Path aliases for the Vite-based tools (Vitest, Storybook), read from the
// `paths` in tsconfig.json so that file stays the only place they are declared.
// Rspack reads tsconfig.json itself (`resolve.tsConfig`). Plain CommonJS so
// both the ESM Vitest config and the TS Storybook config can load it.
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;

/** @returns {Record<string, string>} e.g. { "@utils": "/abs/src/utils" } */
module.exports = function tsconfigAliases() {
    const { compilerOptions } = JSON.parse(
        fs.readFileSync(path.join(root, "tsconfig.json"), "utf8")
    );
    const base = path.resolve(root, compilerOptions.baseUrl ?? ".");
    return Object.fromEntries(
        Object.entries(compilerOptions.paths).map(([alias, [target]]) => [
            alias.replace(/\/\*$/, ""),
            path.resolve(base, target.replace(/\/\*$/, "")),
        ])
    );
};
