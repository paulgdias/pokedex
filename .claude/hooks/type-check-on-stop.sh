#!/usr/bin/env bash
# Stop hook: type-check when TypeScript files have uncommitted changes.
# Exit 2 keeps Claude working so it fixes the errors. Skips the re-run
# (stop_hook_active) to avoid looping forever.
set -u

input=$(cat)
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

git status --porcelain 2>/dev/null | grep -qE '\.(ts|tsx|mts)$' || exit 0

if ! output=$(npm run --silent type-check 2>&1); then
    echo "$output" >&2
    exit 2
fi
