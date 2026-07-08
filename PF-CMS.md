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
- Categories are dynamic, not hardcoded. The folder name is derived from the category display name via `slugifyCategory()` in `save-recipe.ts` (lowercased, spaces and special characters replaced with hyphens). The `CATEGORY_FOLDERS` lookup map was removed. New categories can be created directly from the recipe form with no code changes required.
- Category and tag suggestions in the new/edit recipe form are fetched at page load from `/api/recipe-meta`, which reads existing recipe frontmatter from GitHub and returns the current union of all categories and tags in use. This keeps suggestions accurate without any manual maintenance.
- Image filename: `{slug}.{ext}` (jpg or png). Extension derived from the uploaded file client-side.
- Update flow (edit mode, Phase 3) is already supported: `githubWrite()` fetches the existing file's SHA before writing, so PUT calls work for both create and update.

#### Single-pan ingredient rendering — resolved
`[slug].astro` now renders both the flat top-level `ingredients` list (single-pan) and `panVariants` ingredient lists. The dead fallback block that was incorrectly nested inside the pan-tabs conditional was moved to a proper sibling block after the scale control.

### Phase 3 — Edit Mode & Search ✅ Complete

- [x] 3a: Recipe list view — live-fetched from GitHub on every dashboard load via GitHub Trees API. Renders in three tabs: Published, Drafts, Archived. Fetch and frontmatter parsing happen server-side in `index.astro` frontmatter block (no separate API route needed).
- [x] 3b: Separate edit page at `src/pages/admin/edit/[slug].astro` — fetches recipe from GitHub by slug + category folder, parses frontmatter, pre-populates form via `initEditMode()`. Submits to the same `/api/save-recipe` endpoint as the new recipe form.
- [x] 3c: GitHub API update already supported by `githubWrite()` in `save-recipe.ts` — fetches existing file SHA before writing, so PUT calls handle both create and update transparently.
- [x] 3d: Delete with confirmation modal — hard deletes `.md` file and associated image from GitHub. Implemented in `src/pages/api/delete-recipe.ts`.
- [x] 3e: Archive system — `archived: true` frontmatter flag (same pattern as `draft`). Archived recipes excluded from public site, visible in dashboard Archived tab. Toggle handled by `src/pages/api/archive-recipe.ts` which parses and rewrites only the frontmatter field, preserving the rest of the file exactly. Unarchive removes the flag entirely rather than setting `false`.
- [x] 3f: Search — Pagefind static search index built at deploy time. Header inputs (desktop + mobile) show inline top-3 dropdown as user types. Enter navigates to `/search?q=`. Full results page at `src/pages/search.astro` with live search, URL state sync, and recipe cards.

#### Key decisions made during Phase 3

- **No separate get-recipes API route** — dashboard fetches recipes server-side directly in `index.astro` frontmatter. Simpler, one fewer file, data ready before page renders.
- **Edit URL pattern: `/admin/edit/[slug]?cat={folderName}`** — slug alone is ambiguous (same slug could theoretically exist in different category folders). Category folder is passed as a query param from the dashboard, which knows both values.
- **Slug locked on edit** — changing a recipe's slug would orphan the old file in GitHub and break any existing links. The slug field is locked (`slugLocked = true`) on the edit page and auto-generation is disabled.
- **Shared form helpers** — all DOM-building functions (`makeIngRow`, `makeStepBlock`, `makeVariantBlock`, etc.) extracted to `src/scripts/adminFormHelpers.js` and imported by both `new.astro` and `edit/[slug].astro`. Keeps logic DRY and both forms consistent.
- **Existing image preservation on edit** — `save-recipe.ts` checks for `existingImagePath` in the payload when no new image is uploaded, so the image frontmatter field is not lost on edit.
- **Archive vs. delete** — archive sets `archived: true` in frontmatter, keeping the file in GitHub. Hard delete removes the `.md` and image file permanently. Dashboard modal warns users to consider archiving before deleting.
- **Pagefind chosen for search** — static index built at deploy time, no external services, no API calls at runtime. Scales to any number of recipes with no performance cost. Fails silently in `astro dev` (index only exists after `astro build`). Test search with `astro build && astro preview`.
- **Search index scope** — `data-pagefind-body` on `<main>` in `[slug].astro`. Pan tabs and scale controls tagged `data-pagefind-ignore` to keep ingredient amounts out of results. Category, intro, and image path exposed via `data-pagefind-meta` for structured result display.
- **Search URL state** — `/search` page syncs `?q=` param via `history.replaceState` as user types, keeping results shareable and back-button friendly without page reloads.
- **`/api/recipe-meta` is the one exception** — this endpoint exists specifically to serve the CMS form, not the dashboard. It returns the live union of all categories and tags from recipe frontmatter, used to populate the category select and tag autocomplete on the new/edit recipe forms. Admin-only; never called from public-facing pages.


### Phase 4 — Polish
- [ ] 4a: Client-side + server-side form validation
- [ ] 4b: Inline success/error feedback on the form (no full page reload)
- [ ] 4c: Unsaved changes warning before navigating away
- [ ] 4d: Basic admin dashboard styling — clean, functional, doesn't need to match the
- [ ] 4e: UI Improvements:
      - Move yield field up next to category and times
- [ ] 4f: Extend search index to Glossary and Learn pages — add `data-pagefind-body` to those page templates when built. No other changes required.	
public site