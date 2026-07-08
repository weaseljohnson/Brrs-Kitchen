# File Directory Structure

## Root Directory

.
├── api
├── astro.config.mjs
├── CMS.md
├── content
├── DEV-STACK.md
├── dist
├── env.d.ts
├── LESSONS-LEARNED.md
├── LICENSE
├── node_modules
├── package-lock.json
├── package.json
├── PROJECT_CONTEXT.md
├── public
├── README.md
├── src
├── tsconfig.json
└── UX_AND_CONTENT_GUIDELINES.md

7 directories, 12 files

## SRC Directory

.
├── components
│   ├── Header.astro
│   └── Welcome.astro
├── content.config.ts
├── layouts
│   ├── AdminLayout.astro
│   └── Layout.astro
├── middleware.ts
├── pages
│   ├── admin
│   │   ├── edit
│   │   │   └── [slug].astro
│   │   ├── index.astro
│   │   ├── login.astro
│   │   ├── logout.ts
│   │   └── new.astro
│   ├── api
│   │   ├── admin-login.ts
│   │   ├── archive-recipe.ts
│   │   ├── delete-recipe.ts
│   │   ├── ratings
│   │   │   └── [slug].ts
│   │   ├── recipe-meta.ts
│   │   └── save-recipe.ts
│   ├── index.astro
│   ├── package-lock.json
│   ├── package.json
│   ├── recipes
│   │   ├── [slug].astro
│   │   ├── category
│   │   │   └── [category].astro
│   │   ├── index.astro
│   │   └── print
│   │       └── [slug].astro
│   └── search.astro
├── scripts
│   ├── adminFormHelpers.js
│   └── scaleIngredients.ts
├── styles
│   └── global.css
└── utils
    └── seo.ts

14 directories, 29 files
