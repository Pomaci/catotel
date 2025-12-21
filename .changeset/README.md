# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) to track release intent.

Run `pnpm changeset` to create a new entry. Each entry must specify the packages being changed and the appropriate semver bump.

Use `pnpm changeset:status` locally to preview the release plan that will be generated from the pending entries.
