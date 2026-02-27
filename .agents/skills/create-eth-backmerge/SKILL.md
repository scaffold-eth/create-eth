---
name: create-eth-backmerge
description: "Back-merge upstream (scaffold-eth-2) changes into the create-eth repository and publish to npm. Use this skill when: the user wants to do a backmerge, sync upstream, or pull SE-2 changes into create-eth. This is a recurring workflow (weekly/biweekly) that syncs the upstream-main branch, merges it into a backmerge branch, resolves conflicts, creates a changeset, and opens a PR."
---

# create-eth Backmerge

Back-merge upstream scaffold-eth-2 changes into the create-eth repo and prepare for npm publish.

**This skill must be run from inside a clone of the `scaffold-eth/create-eth` repository.**

## Pre-flight Checks

Before starting, verify:

1. You're inside a `create-eth` repo (check for `templates/` dir and the repo remote pointing to `scaffold-eth/create-eth`)
2. Working tree is clean (`git status` — warn if dirty)
3. The `gh` CLI is available (used later for PR creation)

## Step 1: Sync upstream-main from scaffold-eth-2

Add the upstream remote if it doesn't exist, fetch latest from scaffold-eth-2, update the local `upstream-main` branch, and push it to origin so GitHub stays in sync:

```bash
# Add upstream remote if not already configured
git remote add upstream https://github.com/scaffold-eth/scaffold-eth-2.git 2>/dev/null || true

# Fetch latest from upstream scaffold-eth-2
git fetch upstream

# Update local upstream-main to match upstream's main
git checkout upstream-main
git reset --hard upstream/main

# Push to origin so GitHub fork's upstream-main is synced
git push origin upstream-main --force
```

## Step 2: Update local main and create backmerge branch

```bash
git checkout main
git pull origin main
git checkout -b backmerge-upstream
```

If `backmerge-upstream` already exists, ask the user whether to delete and recreate it or use a different name (e.g. `backmerge-upstream-YYYY-MM-DD`).

## Step 3: Merge upstream-main

```bash
git merge upstream-main
```

## Step 4: Resolve conflicts

If merge conflicts occur:

1. List all conflicted files with `git diff --name-only --diff-filter=U`
2. Handle known conflicts automatically:
   - **Root `yarn.lock`**: Reset to ours — `git checkout --ours yarn.lock` then run `yarn install` to regenerate it
   - **Root `package.json`**: Reset to ours — `git checkout --ours package.json`. Then check if `upstream-main` added any new scripts (especially `next:serve` in the template base `package.json`) and manually add them
3. For all other conflicts, show the conflicted files to the user and help resolve them interactively
4. After resolving, stage all changes: `git add .`
5. Complete the merge: `git commit --no-edit`

## Step 5: Gather upstream changes and create changeset

Before creating the changeset, collect the list of upstream SE-2 PRs included in this backmerge. Run `git log upstream-main --not main --oneline` (or inspect the merge) and extract the SE-2 PR references. Build a summary list like:

```
- description of change (https://github.com/scaffold-eth/scaffold-eth-2/pull/XXXX)
- another change (https://github.com/scaffold-eth/scaffold-eth-2/pull/YYYY)
```

This list will be used in both the changeset and the PR body.

Now create the changeset:

```bash
yarn changeset add
```

When prompted:

- Select **patch** for the version bump
- For the summary, use the list of upstream SE-2 PR descriptions with links. Example:

```
- up solidity version and scaffold-ui (https://github.com/scaffold-eth/scaffold-eth-2/pull/1218)
```

After changeset is created, commit it:

```bash
git add .
git commit -m "chore: add changeset for backmerge"
```

## Step 6: Push and create PR

```bash
git push origin backmerge-upstream
```

The PR title format is `backmerge DD-MM-YY` using today's date. The body lists the upstream SE-2 PRs being merged.

Create the PR using `gh`:

```bash
gh pr create \
  --title "backmerge DD-MM-YY" \
  --body "- change description (https://github.com/scaffold-eth/scaffold-eth-2/pull/XXXX)
- another change (https://github.com/scaffold-eth/scaffold-eth-2/pull/YYYY)" \
  --base main
```

Replace the placeholder title date and body with the actual values.

**Important**: Since create-eth is forked from SE-2, the GitHub UI may default the PR target to the upstream repo. Tell the user to double-check that the PR targets `scaffold-eth/create-eth` `main` branch, NOT the upstream SE-2 repo. If `gh` creates it against the wrong repo, instruct the user to close and recreate manually or adjust in the UI.
