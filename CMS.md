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
| `GITHUB_REPO` | `Brrs-Kitchen` |
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

### Phase 1 — Admin UI ✅ Complete
- [x] 1a: Page scaffold, layout, basic styling
  - `src/layouts/AdminLayout.astro` — shared admin shell with sticky topbar, shared utility classes (buttons, form fields, chips, sections) via `:global()` 
  - `src/pages/admin/index.astro` — dashboard stub with "New Recipe" button; recipe list placeholder for Phase 3
  - `src/pages/admin/logout.ts` — clears auth cookie, redirects to login
- [x] 1b: Core metadata fields: title, category, prepTime, cookTime, yield, intro, pubDate
- [x] 1c: Tags + dietary arrays (dynamic add/remove chips; dietary has datalist suggestions)
- [x] 1d: Pan variants block — toggle via checkbox; off = single flat ingredient list with top-level `yield`; on = dynamic multi-variant blocks each with label, yield, and ingredient list
- [x] 1e: Directions block (dynamic — each step has title + body, reorderable via ↑/↓)
- [x] 1f: Image upload field with client-side preview, drag-and-drop support, clear button
- [x] 1g: Slug auto-generated from title, stored as hidden field (not shown to user)

#### Key decisions made during Phase 1
- `ingredients` added as a top-level schema field in `content.config.ts` for single-pan recipes; `panVariants[].yield` made optional. Keeps single-pan recipes from being forced into the variant wrapper.
- Ingredient items updated to named objects (`count` / `item`) throughout — schema, brownie recipe, and `[slug].astro` all updated consistently.
- Submit button collects full structured payload and logs to console; Phase 2 will replace this with the API call.
- Notes and Credit sections gated behind checkboxes — hidden by default to reduce visual noise.

### Phase 2 — Create Recipe API (`/api/save-recipe.js`) ✅ Complete
- [x] 2a: Receive + validate JSON payload from the form
- [x] 2b: Build YAML frontmatter + MD file string (via js-yaml)
- [x] 2c: GitHub API — commit new .md file to content/recipes/{category-folder}/
- [x] 2d: GitHub API — commit image as base64 to public/images/recipes/
- [x] 2e: Structured error handling; JSON error response back to the form

#### Key decisions made during Phase 2
- `js-yaml` used for frontmatter serialization — handles special characters, unicode, and HTML in step bodies safely.
- Category → folder mapping lives in `CATEGORY_FOLDERS` at the top of `save-recipe.js`. Add new categories there as the site grows.
- Image filename: `{slug}.{ext}` (jpg or png). Extension derived from the uploaded file client-side.
- Update flow (edit mode, Phase 3) is already supported: `githubWrite()` fetches the existing file's SHA before writing, so PUT calls work for both create and update.

#### Known issue — single-pan ingredient rendering
`[slug].astro` only renders the `panVariants` ingredient list. Single-pan recipes that use the top-level `ingredients` field will save correctly but ingredients will not display on the recipe page. Fix needed in `[slug].astro` before publishing single-pan recipes.

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