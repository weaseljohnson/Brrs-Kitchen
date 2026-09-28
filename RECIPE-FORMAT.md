# RECIPE-FORMAT.md
# Brr's Kitchen — Recipe Import Format (v1)

One recipe per file. Format: YAML frontmatter only. The file body after the
closing `---` must be empty. File name is irrelevant; the site derives the
URL slug from `title`.

Unknown fields, legacy fields (`hasNotes`, string-only ingredients) and
malformed values are rejected with an error. Nothing is guessed on import.

## Fields

| Field | Required | Type | Notes |
|---|---|---|---|
| `formatVersion` | yes | number | Always `1`. Not stored on the site. |
| `title` | yes | string | Title Case. Determines the URL slug. |
| `category` | yes | string | Title Case, e.g. "Desserts". Prefer an existing category. |
| `directions` | yes | list | At least 1 step. See Directions. |
| `ingredients` | one of | list | Single-pan recipes. |
| `panVariants` | one of | list | Multi-pan recipes. Never combine with `ingredients`. |
| `yield` | recommended | string | Single-pan only, e.g. "16 brownies". |
| `prepTime` / `cookTime` | no | string | e.g. "35–40 min". |
| `intro` | recommended | string | 1–2 warm sentences. |
| `tags` | no | list of strings | Personal tags, e.g. "Hubby's Favorite". |
| `dietary` | no | list of strings | Only: Gluten Free, Dairy Free, Vegan, Vegetarian, Nut Free, Egg Free, Keto, Low Carb. |
| `notes` | no | list of strings | Tips, variations, storage. One bullet each. |
| `credit` | no | `{name, url}` | Both required if present. `url` must be a valid URL. |
| `pubDate` | no | "YYYY-MM-DD" | Defaults to the import date. |

Set by the site on import, never authored: `draft`, `archived`, `image`, `slug`.
If present in the file they are ignored with a warning.

## Ingredients

Each entry is `{count, item}`.
- `count`: all measurement text. Omit for unmeasured items ("salt, to taste").
- `item`: ingredient name plus prep ("yellow onion, diced").
- Write both metric and imperial where a conversion exists: `"113g (8 tbsp)"`.
- Count items need a size descriptor so the scaler can anchor on a unit:
  `"2 large"` (eggs), `"3 whole"` (cloves). Never a bare `"2"`.
- Allowed units: g, kg, ml, l, tsp, tbsp, cup/cups, fl oz, oz, lb/lbs, pint,
  quart, gallon, large, medium, small, whole.
- No ranges in `count` ("2–3 whole"). The scaler only scales one number.
  Pick a single value and mention flexibility in `item` or `notes`.
- Cans and packages: `count: "14 oz (400g)"`, `item: "canned crushed tomatoes"`.
- Fractions: use ½ ⅓ ⅔ ¼ ¾ ⅛ ⅜ ⅝ ⅞ (not ASCII "1/2").

Grouped ingredients ("For the sauce"): wrap ALL entries as
`{groupName, ingredients: [...]}`. Never mix groups and plain items.

Pan variants: each is `{id, label, yield, ingredients}`. `id` is a
lowercase-hyphenated label ("9x13"). `yield` is required per variant.

## Directions

Each step is `{title, body}`.
- `title`: short, imperative ("Brown the butter").
- `body`: complete sentences, plain text. No Markdown (it will not render).
  `<strong>` and `<em>` are the only permitted HTML.
- Give temperatures in °F and °C, and never skip steps.
- Explain unfamiliar terms in place, and include doneness cues, not just times.

## YAML rules

- UTF-8. Double-quote every string value.
- Escape internal double quotes (`\"`) or use single-quoted YAML.
- No tabs. Indent with 2 spaces.

## Example

```yaml
---
formatVersion: 1
title: "Creamy Tomato Soup"
category: "Soups"
prepTime: "10 min"
cookTime: "30 min"
yield: "6 servings"
intro: "A silky, cozy soup that tastes like it simmered all day."
tags: ["Hubby's Favorite"]
dietary: ["Vegetarian"]
pubDate: "2026-09-27"
ingredients:
  - groupName: "Soup"
    ingredients:
      - count: "28g (2 tbsp)"
        item: "unsalted butter"
      - count: "1 large"
        item: "yellow onion, diced"
  - groupName: "To Finish"
    ingredients:
      - count: "120ml (½ cup)"
        item: "heavy cream"
directions:
  - title: "Sweat the onion"
    body: "Melt the butter in a large pot over medium heat, then cook the onion until soft and translucent, about 8 minutes."
notes:
  - "Freezes well for up to 3 months. Add the cream after reheating."
---
```

## Validation error format

Errors are returned as `path: message` lines that can be pasted straight
back to Claude, e.g. `ingredients.2.count: "2–3 whole" contains a range`.