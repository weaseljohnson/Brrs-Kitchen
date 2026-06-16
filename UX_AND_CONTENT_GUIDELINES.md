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
- Dynamic yield display (updates when pan tab changes)
- Prep / cook / yield stats bar
- Category label with accent styling
- Numbered step directions with titled steps
- Tags display — personal labels (burnt-peach) and dietary flags (olive)
- Freeform notes section below directions (rendered from MD body, gated by `hasNotes` flag)
- Image placeholder (awaiting CMS image upload flow)

### Planned
- Pro tip tooltip callouts — inline in recipe body, dismissible
- Feedback and questions form — button opens form, responses go to admin
- Admin-curated Q&A displayed below recipe
- Glossary term links — inline links to glossary page
- Skill page links — inline links to cooking fundamentals

### Image Handling
- TBD — whether images are required or optional per recipe
- Upload flow to be handled via CMS (Step 5)


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


