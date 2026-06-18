# CMS.md
# Brr's Kitchen — CMS Build Reference

---

## Overview

Custom CMS at `/admin` — a password-protected admin interface that allows Brianna to create and edit recipes. On save, a Vercel serverless function commits the recipe as a Markdown file to the GitHub repo, triggering an automatic Astro rebuild and deploy.

---

## Tech Approach

- Admin route protected by middleware (`src/middleware.ts`) + httpOnly cookie auth
- Serverless function at `/api/save-recipe.js` handles GitHub API calls
- Images stored in GitHub repo at `/public/images/recipes/`
- Astro running in `output: 'server'` mode; all public pages explicitly marked `export const prerender = true`

---

## UI Decisions

- Loosely matches public site — same font and color tokens, simpler layout
- Lands on a dashboard (recipe list + "New Recipe" button) rather than directly on the form

---

## Environment Variables

Required in both `.env` (local) and Vercel dashboard (production):

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Password Brianna uses to log in |
| `ADMIN_COOKIE_SECRET` | Random string stored in auth cookie |
| `GITHUB_TOKEN` | GitHub Personal Access Token (Contents: read/write) |
| `GITHUB_OWNER` | `weaseljohnson` |
| `GITHUB_REPO` | `brr-s-kitchen` |
| `GITHUB_BRANCH` | `main` |

---

## Auth Flow

- `src/middleware.ts` — intercepts all `/admin/*` requests, checks for `brrs_admin_auth` cookie matching `ADMIN_COOKIE_SECRET`, redirects to `/admin/login` if missing or invalid
- `src/pages/admin/login.astro` — standalone login page (noindex, no site header)
- `src/pages/api/admin-login.ts` — POST endpoint, validates password, sets httpOnly cookie. Cookie uses `secure: import.meta.env.PROD` so it works over HTTP locally and HTTPS in production

### Known gotcha
Astro's middleware virtual module parser breaks on special characters (`.` `'`) in directory path strings. Ensure the project directory path contains no special characters.

---

## Build Plan

### Phase 0 — Prerequisites ✅ Complete
- [x] 0a: GitHub PAT created, added to Vercel env vars
- [x] 0b: Repo name and env var names confirmed
- [x] 0c: Middleware auth implemented and working

### Phase 1 — Admin UI (`/src/pages/admin/index.astro`)
- [ ] 1a: Page scaffold, layout, basic styling
- [ ] 1b: Core metadata fields: title, category, prepTime, cookTime, yield, intro, pubDate
- [ ] 1c: Tags + dietary arrays (dynamic add/remove chips)
- [ ] 1d: Pan variants block (dynamic — each variant has label, yield, ingredient list)
- [ ] 1e: Directions block (dynamic — each step has title + body, reorderable)
- [ ] 1f: Image upload field with client-side preview
- [ ] 1g: Slug field (auto-generated from title, manually overrideable)

### Phase 2 — Create Recipe API (`/api/save-recipe.js`)
- [ ] 2a: Receive + validate JSON payload from the form
- [ ] 2b: Build the YAML frontmatter + MD file string
- [ ] 2c: GitHub API call — create new .md file in /content/recipes/
- [ ] 2d: GitHub API call — write image as base64 to /public/images/recipes/
- [ ] 2e: Structured error handling and response back to the form

### Phase 3 — Edit Mode

- [ ] 3a: Recipe list view — fetches all recipes from GitHub and renders them as a selectable list
- [ ] 3b: Pre-populate the form when a recipe is selected for editing
- [ ] 3c: GitHub API — update existing file (requires fetching the file's current SHA first)
- [ ] 3d: Delete with confirmation modal

### Phase 4 — Polish
- [ ] 4a: Client-side + server-side form validation
- [ ] 4b: Inline success/error feedback on the form (no full page reload)
- [ ] 4c: Unsaved changes warning before navigating away
- [ ] 4d: Basic admin dashboard styling — clean, functional, doesn't need to match the public site