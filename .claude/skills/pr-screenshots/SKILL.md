---
name: pr-screenshots
description: Attach screenshots to a pull request with gh --attach. Use when opening or updating a PR that changes how the app looks (src/components, src/pages, src/styles, public/index.html, a new or restyled component), so reviewers see the result without checking out the branch. Skip it for changes with no visual effect (api/, utils, tests, docs, CI).
---

# PR screenshots

A reviewer should see a visual change, not imagine it from class names. Attach screenshots to the PR with `gh --attach`, which uploads them to GitHub and rewrites the image references in the body.

## Steps

1. **Capture** the changed screens from the branch being reviewed, not from `main`:
   - Pages: `npm run dev` (port 3000) and open the route. Use a 1440-wide viewport, the light theme, and add the dark theme when the change touches colors or tokens.
   - A single component: `npm run storybook` (port 6006), `iframe.html?id=<story-id>&viewMode=story`; add `&globals=theme:dark` for dark.
   - Show the states the change is about (open popover, empty state, disabled), and a before/after pair when it restyles something that already existed.
   - Keep the images outside the repo (a scratch directory), one per screen. PNG or JPG, 3 to 6 images is plenty. Check no personal data is visible.
2. **Write the PR body** with an image reference per screenshot and a one-line caption saying what to look at, for example `![Type popover](./type-popover.png)`. Use relative `./name.png` paths: `gh` swaps them for the uploaded URLs.
3. **Attach**, running the command from the directory that holds the images:
   - New PR: `gh pr create --body-file body.md --attach './type-popover.png#Type popover' --attach './toolbar.png#Toolbar'`
   - Existing PR: `gh pr edit <number> --attach './after.png#After'` (without a body flag the attachment is appended to the current body; with `--body-file` the references in it are rewritten instead). To post them as a comment instead, use `gh pr comment <number> --attach ...`.
   - The `#alt text` after the path is the image's alt text. Up to 50 files per command. The flag needs a recent `gh`; `gh pr create --help` lists `--attach` if it is there.
4. **Check** the result: `gh pr view <number> --json body -q .body | grep '!\['` should list `https://github.com/user-attachments/assets/...` URLs, none of them relative paths.

## Do not

- Commit the images to the repo or to the PR branch: they bloat the diff and the history.
- Push an `assets/*` branch and link its `raw.githubusercontent.com` URLs. The links break when the branch is deleted (this happened on #24, whose images now return 404). `--attach` uploads need no branch.
- Link a local file path or a `localhost` URL: nobody else can open it.
- Attach screenshots to a PR with no visual change just to have some.
