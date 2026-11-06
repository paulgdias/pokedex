#!/usr/bin/env bash
# PreToolUse hook: refuse hand-edits to generated, cached or lock files.
# Exit 2 blocks the edit and feeds the message back to Claude.
set -u

file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

case "$file" in
    */dist/* | */coverage/* | */storybook-static/* | */__screenshots__/* | \
        */playwright-report/* | */test-results/* | */.vitest/* | \
        */api/.cache/* | */node_modules/* | \
        */package-lock.json | */api/package-lock.json)
        echo "Blocked: $file is generated, cached or a lock file. Regenerate it with the proper command instead of editing it by hand." >&2
        exit 2
        ;;
esac
exit 0
