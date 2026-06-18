# UX_AND_CONTENT_GUIDELINES.md
# Brrs Kitchen — UX & Content Guidelines

---

## Logo and Page Title

Page Title: Brr's Kitchen

Logo: See (file TBD)

---

## The Feels

These are descriptive constraints which have been provided by Brianna to guide the feel/tone of the website.

- Warm, inviting, casual. But not farmhouse kitchen style. More polished and put together.
- Take a middle ground approach on the elements, feel and theme. Not too professional and sterile. But she also not so casual that it’s lazy or sloppy.
- There should be a touch of subtle elegance. But not fancy, like a high end restaurant. Sophisticated without being high end chef site.
- Wants it to feel like a welcoming at home kitchen with tasty food. 
- No patterns or in the background. The design should be of a more minimalist artistic style. 
- There should be an element of creativity and inspiration. Brianna (Brr) is a creative in the kitchen, and the recipes on the site will be her own. The website should reflect that. 


---

## Layout Decisions

### Page Structure

#### Homepage
- **Banner** — Full-width-within-container image (`HP-Banner.png`) in a rounded rectangle, constrained to the same width as the header content area. Contains:
  - Splash text: "Welcome to Brr's Kitchen!" in PT Serif bold, centered, positioned roughly halfway up the image. On mobile, forced to two lines: "Welcome to" / "Brr's Kitchen!"
  - Banner nav: "Recipes" and "About Brr" links, centered, sitting near the bottom of the image with a shared top/bottom border. Ghost pill on hover. No backgrounds on the links themselves.
  - Dark gradient overlay from ~25% down to bottom for text legibility.
- **Latest Recipes** — Up to 4 most recent recipes below the banner.
  - Layout: one large card (left ~60%) + up to 3 small cards stacked (right ~40%)
  - Large card: recipe header image (16:9), category label, title, intro text (clamped to 3 lines), prep/cook times
  - Small cards: square-cropped image (left), title, prep/cook times
  - `intro` frontmatter field supports inline HTML via `set:html`. Long-term, consider splitting into `introHighlight` (bold callout) and plain `intro` text to keep frontmatter HTML-free and CMS-friendly.
  - Stacks to single column on mobile; large card renders first.

#### Recipe Navigation
- Organized by meal type (Mains, Desserts, Sides, Drinks, Snacks, etc.)
  - Mains organized by protein type
  - Desserts by general type (ice cream, baked goods, drinks)

#### Learn / How-To Page (planned)
- Replaces the former separate Cooking Essentials and Cooking Fundamentals nav items
- Cooking Essentials: homemade versions of commonly store-bought recipe ingredients (ricotta, yogurt, clarified butter, buttermilk, spice mixes, sauces)
- Cooking Fundamentals: how-to videos (YouTube embeds) and instructions for basic cooking skills (knife skills, chopping, etc.) organized hierarchically

#### Other Pages
- **Glossary** — Common culinary terms used throughout the site (Maillard reaction, umami, caramelize, etc.)
- **About** — Brianna's personal introduction (content TBD)
	  
### Navigation

- Single-row sticky header: logo (left), nav (right), pill search bar as last nav item
- Header height: 125px desktop, 90px mobile
- Logo: transparent PNG, 120px tall on desktop, 72px on mobile. Stored at `/public/images/logo/`
- Primary nav items: Recipes, Learn / How-To, Glossary, About
- All nav items are static links — no dropdowns currently active
- Dropdown infrastructure remains in Header.astro for future use; no current nav items trigger it
- Desktop search: always-visible pill-shaped input (magnifying glass icon + "Search" placeholder). Input expands from 90px to 150px on focus. Placeholder text clears on focus.
- Mobile search: magnifying glass icon to the left of the hamburger toggle. Tapping expands a pill-shaped search bar in a row below the header (inside the sticky shell). Opening search closes the hamburger nav, and vice versa.
- Mobile nav: full-screen overlay triggered by hamburger toggle at 900px breakpoint. No search bar inside the hamburger menu.
- Logo files stored in `/public/images/logo/`: transparent version (`BK-Logo-Header.png`), color version (`BK-Logo-Color.png`), text-only version (`BK-Logo-Text.png`)


### Internal Links, Tags, and Labels

- Tags that show on page to help highlight things about the recipes
    - Hubby’s favorite, kids favorite, etc…
    - Dietary restriction (dairy free, gluten free, vegan, etc.)
    
## Recipe Page Features

### Implemented

- Pan size tabs with dynamic ingredient switching
- Dynamic yield display (updates when pan tab changes or scale is adjusted)
- Prep / cook / yield stats bar
- Category label with accent styling
- Numbered step directions with titled steps
- Tags display — personal labels (burnt-peach) and dietary flags (olive)
- Freeform notes section below directions (rendered from MD body, gated by `hasNotes` flag)
- Recipe header image — 3:2 aspect ratio, floats half above the header border box. Cream background padding creates a visual gap between image and box border. Falls back to a muted placeholder if no image is present.
- Print Recipe button — opens `/recipes/print/[slug]` in a new tab. Print page is a minimal layout (no site header) that auto-triggers `window.print()` on load. Carries `?pan=` and `?scale=` query params so the print page matches the user's current selections.
- Pin Recipe button — links to Pinterest share endpoint with pre-filled URL and recipe title.
- Credit attribution — optional `credit` frontmatter field (named object: `name` + `url`). Renders below intro text, above action buttons, as "Credit: [Name]" in muted italic. Also renders on the print page. Neutral label intentionally avoids assuming "adapted from" vs. "by."
- Ingredient scaling — segmented ½×/1×/2× radio control. Sits below the pan selector when pan variants are present, standalone otherwise. Yield display scales with the control. Scale state is passed to the print page via `?scale=` query param.

### Ingredient Schema

Ingredients are structured named objects, not plain strings. Each ingredient has two fields:

```yaml
- count: "113g (8 tbsp)"   # optional — omit for uncounted items
  item: "unsalted butter"
```

- `count` contains all measurement text (metric, imperial, or both). This is the only field the scaler operates on.
- `item` contains the ingredient name and any descriptors. Never touched by the scaler.
- `count` is optional — items with no quantity (e.g. "butter for greasing") omit it entirely.
- **House style rule:** count items always use a size descriptor so the scaler can anchor on a unit — write `"2 large"` not `"2"` for eggs, `"3 whole"` not `"3"` for cloves, etc. This is the only case where scaling requires authoring discipline.

### Ingredient Scaling Rules (scaleIngredients.ts)

Shared utility at `src/scripts/scaleIngredients.ts`. Exports `scaleCount(str, factor)` and `scaleYield(str, factor)`.

**Metric**
- `g` and `kg` scale in place. No cross-unit conversion (grams stay as grams).
- `ml` stays as ml below 1000ml; converts to `l` at 1000ml+.

**Imperial volume — conversion chain**
- `tsp` → `tbsp` at exact multiples of 3 (3 tsp = 1 tbsp). Chains forward.
- `tbsp` → `cup` at exact multiples of 4 (4 tbsp = ¼ cup). Chains forward.
- `cup` → `tbsp`/`tsp` when value drops below ¼ cup. Remainder expressed as `tbsp + tsp` if the tsp value is a whole number, otherwise fractional tbsp.
- `cup` → `gallon` only at exact 8-cup multiples (8 cups = ½ gallon, 16 cups = 1 gallon). Quarts and pints are not used as intermediate units — cups convert directly to half-gallon / gallon.

**Imperial weight and large volume**
- `oz`, `lb`, `pint`, `quart`, `gallon` — scale in place, no cross-unit conversion.

**Fractions**
- Output snaps to nearest common cooking fraction: ⅛, ¼, ⅓, ⅜, ½, ⅔, ¾, ⅞.
- ⅙ and ⅚ are intentionally excluded from output (not real cooking measurements) but remain in the input parser so authored recipes using them are read correctly.
- Compound measurements (e.g. `"1 cup + 2 tbsp"`) — each token scales and converts independently. No simplification is attempted.

**Count descriptors**
- `large`, `medium`, `small`, `whole` are recognized as units. The leading number scales; the descriptor is preserved.

### Planned

- Pro tip tooltip callouts — inline in recipe body, dismissible
- Feedback and questions form — button opens form, responses go to admin
- Admin-curated Q&A displayed below recipe
- Glossary term links — inline links to glossary page
- Skill page links — inline links to cooking fundamentals

### Print Page (`/recipes/print/[slug]`)

- Separate static route at `src/pages/recipes/print/[slug].astro` — no site header, minimal layout optimized for paper
- Opens in a new tab from the Print Recipe button; auto-triggers `window.print()` on load
- Reads `?pan=` and `?scale=` query params from the URL to match the user's active selections on the recipe page
- Print button `href` updates dynamically as the user switches pan tabs or scale factor
- Credit attribution displays below intro when present
- `@media print` block strips container padding for clean paper output
- Marked `noindex, nofollow` — must be added explicitly to the print page's own `<head>` since it does not use `Layout.astro` and won't inherit sitewide meta tags

### Image Handling

- Recipe images stored at `/public/images/recipes/`
- Declared in frontmatter as `image: "/images/recipes/Filename.jpg"`
- Used in the recipe header (3:2 ratio, floats above border box) and homepage recipe cards (16:9 large card, square-cropped small cards)
- Image is optional — all templates fall back to a muted olive placeholder


### Decorative / Design Decisions

- Border with pieces of chopped veggies or herbs 

---

## Fonts

- Headers: PT Serif (400 Regular, 400 Italic, 700 Bold, 700 Bold Italic) — static files
- Body text: DM Sans 400 Regular — variable file
- Accent text: DM Sans 200 Extra Light Italic — variable file
- Font files are self-hosted in `/public/fonts/`
- File names:
  - `PTSerif-Regular.woff2`
  - `PTSerif-Italic.woff2`
  - `PTSerif-Bold.woff2`
  - `PTSerif-BoldItalic.woff2`
  - `DMSans-VariableFont.woff2`
  - `DMSans-Italic-VariableFont.woff2`

---


## Color Palette

| Token | Alias | Hex |
|---|---|---|
| `--cream` | `--color-bg` | #fdf8f2 |
| `--dusty-olive` | `--color-accent-1` | #76825f |
| `--cinnamon-wood` | `--color-accent-2` | #BD7A57 |
| `--raw-umber` | `--color-accent-3` | #793b02 |
| `--coffee-bean` | `--color-text` | #1c1317 |
| `--text-muted` | `--color-text-muted` | #64696A |

Always use the semantic alias (e.g. `--color-accent-2`) in components, not the raw palette name.

---


