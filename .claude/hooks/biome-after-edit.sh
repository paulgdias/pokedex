#!/usr/bin/env bash
# PostToolUse hook: format and lint the file Claude just edited with Biome.
# Feeds lint errors back to Claude (exit 2); ignores files Biome does not cover.
set -u

file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

case "$file" in
    *.ts | *.tsx | *.mts | *.js | *.mjs | *.cjs | *.json | *.css) ;;
    *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if ! output=$(npx --no-install biome check --write "$file" 2>&1); then
    echo "$output" >&2
    exit 2
fi
