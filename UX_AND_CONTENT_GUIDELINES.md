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

### Page Structure & Navigation

- Recipe navigation to be done by meal type (mains, desserts, sides, drinks, etc)
    - Mains organized by protein type
    - Desserts by general type (ice cream, baked goods, drinks)
- Page for Cooking Essentials or Recipe Components
	- This page contains recipes for homemade versions of commonly storebought recipe
	  ingredients such as ricotta cheese, yogurt, clarified butter, buttermilk, spice
	  mixes, and sauces
- Cooking Fundamentals
	- This page has how-to videos (youtube links) and instructions for basic cooking
	  skills such as knife skills, how to chop veggies, etc
	- The high level items would be things like, chopping veggies, knife skills, etc. then
	  you’d have sub items or pages below that for specific skills or cases
- Glossary Page
	- This page contains a glossary of common terms used throughout the site. Specific
	  food science related things or terms that people might not be familiar with. Ex. The
	  Maillard reaction, Umami, Carmelize, etc


### Internal Links, Tags, and Labels

- Tags that show on page to help highlight things about the recipes
    - Hubby’s favorite, kids favorite, etc…
    - Dietary restriction (dairy free, gluten free, vegan, etc.)
    
## Recipe Page Features

### Implemented
- Pan size tabs with dynamic ingredient switching
- Dynamic serving size display
- Prep / cook time / yield stats bar
- Category label with accent styling
- Numbered step directions with titled steps

### Planned
- Pro tip tooltip callouts — inline in recipe body, dismissible
- Tags display — "Hubby's Favorite", "Kid's Favorite", dietary restrictions
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
| `--burnt-peach` | `--color-accent-2` | #de7c5a |
| `--raw-umber` | `--color-accent-3` | #793b02 |
| `--coffee-bean` | `--color-text` | #1c1317 |
| `--text-muted` | `--color-text-muted` | #5a6a7a |

Always use the semantic alias (e.g. `--color-accent-2`) in components, not the raw palette name.

---


