# Recipe Site — Dev Stack Reference

## Stack Summary

| Layer | Tool | Role |
|---|---|---|
| Hosting & Functions | Vercel | Serves the site, runs serverless functions |
| Build Tool | Astro | Converts MD + templates → static HTML |
| Source of Truth | GitHub | Stores all source files, triggers deploys |
| Content Management | Custom CMS (`/admin`) | Wife's interface for adding/editing recipes |

---

## How It All Fits Together

```mermaid
flowchart TD
    subgraph AUTHOR ["✍️ Content Authoring"]
        A["Wife opens /admin\n(Custom CMS)"]
        B["Fills out recipe form\n(title, ingredients, steps,\ncategory, image, etc.)"]
        C["Hits Save / Submit"]
    end

    subgraph FUNCTION ["⚡ Vercel Serverless Function"]
        D["Receives form data"]
        E["Formats content as\nMarkdown + frontmatter"]
        F["Calls GitHub API\n(create or update file)"]
        G["Uploads image to\n/assets/images/ in repo"]
    end

    subgraph REPO ["📦 GitHub Repository (Source of Truth)"]
        H["MD recipe files\n/content/recipes/"]
        I["Images\n/public/images/"]
        J["Astro templates\n/src/layouts/"]
        K["CMS admin page\n/src/pages/admin/"]
    end

    subgraph BUILD ["🔨 Astro Build (runs on Vercel)"]
        L["Astro reads all MD files"]
        M["Matches each recipe to\nits template (by folder\nor frontmatter tag)"]
        N["Injects recipe data\ninto template"]
        O["Outputs static HTML\nfiles to dist/"]
    end

    subgraph SERVE ["🌐 Vercel CDN (Live Site)"]
        P["Static HTML/CSS/JS\nserved globally"]
        Q["Visitor loads recipe page\n(instant, no computation)"]
    end

    A --> B --> C --> D
    D --> E --> F --> H
    D --> G --> I
    F -- "commit triggers\nauto-deploy" --> L
    H --> L
    I --> L
    J --> M
    L --> M --> N --> O --> P --> Q
```

---

## Key Concepts to Remember

### GitHub is the single source of truth
Everything important lives in the repo — recipe MD files, images, templates, and the admin CMS code. Vercel is disposable; if you ever needed to switch hosts, you'd point a new host at the same repo and get the same site.

### Vercel builds once per commit, not per page load
When a new commit hits GitHub, Vercel spins up, runs `astro build`, and stores the output on their CDN. Visitors receive pre-built HTML files — no processing at request time. This is what makes the site fast and keeps it well within Vercel's free tier limits.

### Astro separates content from presentation
- **MD files** = the *what* (recipe data)
- **Astro templates** = the *how* (layout and design)
- They are never mixed together. Updating a template rebuilds every recipe page automatically on next deploy.

### Multiple templates are supported
Templates can be assigned by folder location or by a `template:` tag in the MD file's frontmatter. Useful for different recipe types (standard, drinks, quick/simple).

### Editing existing recipes
The custom CMS supports both creating and editing recipes. The admin page fetches existing MD files from GitHub, pre-populates the form, and on save calls the GitHub API to update the file in place (same flow as create, different API call).

---

## Frontmatter Reference (MD file header)

Every recipe MD file starts with a YAML frontmatter block that Astro reads as structured data:

```yaml
---
title: "Grandma's Lasagna"
category: "Italian"          # controls folder/routing
template: "recipe-full"      # optional: explicit template override
prepTime: 30                 # minutes
cookTime: 90                 # minutes
servings: 8
difficulty: "medium"         # easy | medium | hard
tags: ["pasta", "comfort food", "make-ahead"]
image: "/images/lasagna.jpg"
---

Recipe body / notes in plain Markdown here...
```

---

## Repo Structure (planned)



```
/
├── src/
	│   .
	├── components
	│   ├── Header.astro
	│   └── Welcome.astro
	├── content.config.ts
	├── layouts
	│   └── Layout.astro
	├── pages
	│   ├── admin
	│   │   └── index.astro
	│   ├── index.astro
	│   └── recipes
	│       ├── [slug].astro
	│       └── print
	│           └── [slug].astro
	├── scripts
	│   └── scaleIngredients.ts
	├── styles
	│   └── global.css
	└── utils
		└── seo.ts
├── public/
	│   .
	├── fonts
	│   ├── DMSans-Italic-VariableFont.woff2
	│   ├── DMSans-VariableFont.woff2
	│   ├── PTSerif-Bold.woff2
	│   ├── PTSerif-BoldItalic.woff2
	│   ├── PTSerif-Italic.woff2
	│   └── PTSerif-Regular.woff2
	└── images
		├── HP-Banner-Dark.png
		├── HP-Banner.png
		├── logo
		│   ├── android-chrome-192x192.png
		│   ├── android-chrome-512x512.png
		│   ├── apple-touch-icon.png
		│   ├── BK_Logo Original Style Inspiration.png
		│   ├── BK-Favicon-thin.png
		│   ├── BK-favicon.png
		│   ├── BK-Logo-Color.png
		│   ├── BK-Logo-Header.png
		│   ├── BK-Logo-Text.png
		│   ├── favicon-16x16.png
		│   ├── favicon-32x32.png
		│   ├── favicon.ico
		│   └── site.webmanifest
		├── og
		│   ├── og-default.jpg
		│   └── og-default.png
		└── recipes
			└── Brownies.jpg
├── content/
	└── recipes
		├── blank.gitkeep
		└── desserts
			└── best-homemade-brownies.md
├── api/	
│   └── save-recipe.js        # not yet built
└── astro.config.mjs
```

---

## Deployment Flow (simplified)

```
Wife submits form → Vercel function → GitHub commit → Vercel auto-deploy → Site updated
```

Average time from "save recipe" to "live on site": **~30–60 seconds** (Astro build time).
```

---

## Build Log

### Step 1 — Vercel ↔ GitHub Connection
✅ Complete

### Step 2 — Astro Project Scaffolding
✅ Complete

### Step 3 — Design Tokens / Global CSS
✅ Complete
- Global stylesheet at `src/styles/global.css`
- Imported in base Astro layout (pending — Step 4)
- Fonts self-hosted in `/public/fonts/`
- CSS variables use semantic aliases; always reference those in components

### Step 4 — Core Astro Layouts
✅ Complete
✅ Dynamic route at `src/pages/recipes/[slug].astro`
✅ Content collection defined in `src/content.config.ts`
✅ Recipe markdown files stored in `/content/recipes/`
✅ Global stylesheet imported via frontmatter in `Layout.astro`
✅ Header component at `src/components/Header.astro` — single-row sticky nav, dropdown menus, desktop search overlay, mobile hamburger menu with integrated search bar- Home page at `src/pages/index.astro` — category tiles, latest recipes, about blurb
✅ Brownie recipe live at `/recipes/best-homemade-brownies`
✅ All recipe data sourced from frontmatter — no hardcoded content in templates
✅ MD body reserved for optional freeform notes (gated by `hasNotes` frontmatter flag)

### Step 5 — SEO & Structured Data
✅ Complete
- Utility module at `src/utils/seo.ts` — schema builders, ISO 8601 time parser, duration adder, safe JSON-LD serializer
- `Layout.astro` updated: canonical URL, robots meta, Open Graph tags, Twitter/X Card, JSON-LD `@graph` block, full favicon/icon link set
- `[slug].astro`: builds and passes `Recipe` schema (with `HowToStep` instructions, ISO durations, ingredients, keywords, image)
- `index.astro`: builds and passes `WebPage` schema
- `astro.config.mjs`: `site` option set to `https://brrs-kitchen.com` (required for `Astro.url.origin` in production)
- Print pages (`/recipes/print/[slug]`): need explicit `noindex, nofollow` meta — no `Layout.astro` inheritance





