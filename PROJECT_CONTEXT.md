# PROJECT_CONTEXT.md
# Brr's Kitchen — Project Context

---

## What This Project Is

A homegrown cookbook manifested as a website. This website hosts all of the culinary creations from the mind of Brr (Brianna). This site and the recipes it contains are primarily targeted for sharing with family and friends, but will also be available to the public if anyone manages to find them via google search. 


**GitHub repo:** https://github.com/weaseljohnson/Brr.s-Kitchen/
**Live URL:** https://brrs-kitchen.com/

---

## Core Purpose

To serve as a place where Brianna can store all her favorite recipes, share them with family and friends, and document all her culinary knowledge, tips, tricks, and expertise.

---

## Project Philosophy

- **Not a Cooking Blog** This site avoids all of the annoying trends of the modern day cooking blog or recipe website. It doesn't have annoying pop ups, doesn't have ads, and doesn't have cookies or store user data
- **Clean, organized, clear, and creative** This site gets straight to the points. Recipe pages are just that, recipe pages. No distractions or extraneous content. Just pure information, straight to the point. The recipe's don't skip steps, include helpful tips, and explain unfamiliar terms. the page is easily navigable, and enjoyable to interact with.
- **Mobile First Architecture** The site will be primarily designed with mobile users in mind. But the desktop should also be clean, and enjoyable to interface with. 
---

## Tech Stack

See DEV-STACK.md

---

## SEO Strategy

- Page title: "Brr's Kitchen"
- Mobile responsiveness is a ranking signal
- robots.txt, sitemap.xml, and canonical tag implemented
- Self-hosted fonts (no external font requests)

### Technical SEO
- Canonical tag — injected via `Layout.astro` using `Astro.url.href`
- robots meta — `index, follow` sitewide; print pages get `noindex, nofollow` explicitly
- robots.txt deployed
- sitemap.xml deployed
- Fast static site (Astro SSG, served via Vercel CDN)
- Mobile-first responsive layout
- Open Graph tags — `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:alt`
- Twitter/X Card — `summary_large_image` card type
- OG image: default at `/public/images/og/og-default.jpg` (1200×630px). Recipe pages use their recipe image. Per-recipe OG images can be added later via an `ogImage` frontmatter field.

### Structured Data (JSON-LD)
All schema is injected as a single `@graph` block per page via `Layout.astro`.

Utility functions live in `src/utils/seo.ts`:
- `buildWebSiteSchema()` — sitewide, every page
- `buildOrganizationSchema()` — sitewide, every page
- `buildWebPageSchema()` — homepage and general pages
- `buildRecipeSchema()` — recipe pages only
- `parseTimeToISO()` — converts frontmatter time strings to ISO 8601 (e.g. `"20–25 min"` → `"PT25M"`, using the maximum of ranges)
- `addISODurations()` — adds prep + cook for `totalTime`
- `safeJsonLd()` — serializes schema safely for HTML injection

| Page | Schema types |
|---|---|
| Every page | `WebSite`, `Organization` |
| Homepage | + `WebPage` |
| Recipe pages | + `Recipe` (with `HowToStep` instructions) |
| About, Glossary, Learn | + `WebPage` (when pages are built) |
| Print pages | No schema; `noindex` meta only |

`WebSite` schema includes a `potentialAction` (Sitelinks Search Box) — currently commented out in `seo.ts`, uncomment when site search is live.

### On-Page SEO
- TBD — content strategy for meta descriptions per recipe (currently pulled from `intro` frontmatter field)

### Favicon / App Icons
All icon variants declared in `Layout.astro` `<head>`. Files live in `/public/images/logo/`:
- `favicon.svg`, `favicon.ico`
- `apple-touch-icon.png` (180×180)
- `favicon-32x32.png`, `favicon-16x16.png`
- `android-chrome-192x192.png`, `android-chrome-512x512.png`
- `site.webmanifest` in `/public/`

---

---

## File Structure

TBD

---