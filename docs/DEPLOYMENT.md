# Deployment Guide

## Prerequisites

- GitHub repository (public or private)
- Vercel account connected to the repository
- Anthropic API key
- GitHub Personal Access Token (classic)

---

## Step 1: GitHub Token

Create a Personal Access Token (classic) at github.com/settings/tokens:

- **Scopes:** `repo` (full control of private repositories)

This token is used by Studio AI to create branches, open pull requests, commit content changes, and merge approved PRs.

---

## Step 2: Vercel Project Setup

1. Import the repository at **vercel.com/new**
2. Framework: **Next.js** (auto-detected)
3. Build command: `npm run build` (auto-detected)
4. Leave the default branch deployments as-is — Vercel will also deploy previews for every pull request automatically.

---

## Step 3: Environment Variables in Vercel

Go to **Project → Settings → Environment Variables**.  
Add these for **all environments** (Production, Preview, Development):

| Variable                | Description                            | Example                 |
| ----------------------- | -------------------------------------- | ----------------------- |
| `GITHUB_TOKEN`          | GitHub PAT with `repo` scope           | `ghp_xxxx`              |
| `GITHUB_OWNER`          | GitHub username or org                 | `your-username`         |
| `GITHUB_REPO`           | Repository name                        | `client-site`           |
| `GITHUB_DEFAULT_BRANCH` | Main branch name                       | `main`                  |
| `ANTHROPIC_API_KEY`     | Anthropic API key                      | `sk-ant-xxxx`           |
| `STUDIO_USERS`          | `username:role` pairs, comma-separated | `admin:client,dev:team` |
| `STUDIO_PASSWORD`       | Shared studio access password          | `a-secure-password`     |
| `AUTH_SECRET`           | Random 32+ char string for JWT signing | `random-string-here`    |

---

## Step 4: GitHub Actions Secrets & Variables

Go to **Repository → Settings → Secrets and Variables → Actions**.

**Secrets** (sensitive, not visible in logs):

- `GH_CONTENT_TOKEN` — the same GitHub PAT from Step 1

**Variables** (non-sensitive, visible in logs):

- `GITHUB_OWNER` — GitHub username or organization
- `GITHUB_REPO` — repository name

---

## Step 5: Recommended GitHub Repository Settings

### Auto-delete branches

**Settings → General → Pull Requests:**

- ✅ Automatically delete head branches

This ensures `edit/*` branches are cleaned up automatically after a PR is merged or closed.

### Branch protection for `main`

**Settings → Branches → Add rule for `main`:**

- ✅ Require status checks to pass before merging
  - Required check: **Type Check & Lint & Build**
- ✅ Require branches to be up to date before merging

This prevents broken content edits from reaching production.

---

## Step 6: Verify the Setup

1. **Push to `main`** → CI passes + Vercel deploys to production
2. **Visit `/studio-ai`** → login page appears, redirects from `/studio-ai`
3. **Log in** → make an edit in the chat
4. **Check GitHub** → a PR from `edit/...` to `main` is created
5. **Wait ~60 seconds** → Vercel posts the preview URL as a deployment status on the PR
6. **Approve in the studio** → PR is squash-merged → production updates in ~60 seconds
7. **Discard in the studio** → PR is closed → branch is deleted

---

## Edit Flow Summary

```
User requests change in /studio-ai/chat
  → Studio AI creates edit/* branch
  → Commits content change to branch
  → Opens Pull Request to main
  → Vercel automatically deploys preview for the PR
  → Preview URL appears in the studio banner (~30–60 seconds)
  → User reviews changes in the preview
  → User approves → PR is squash-merged → production deploys
  → User discards → PR is closed → branch is deleted
```
