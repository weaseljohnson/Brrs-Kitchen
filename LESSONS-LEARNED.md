# LESSONS_LEARNED.md
# Brr's Kitchen — Lessons Learned

Ongoing log of non-obvious problems, solutions, and decisions made during development.

---

## Astro-Specific

- **`content.config.ts` must live at `src/content.config.ts`** — Not at the project root and not inside `src/content/`. Astro 6 is strict about this. Wrong location produces no error, just a silently empty collection.

- **Content files cannot live in `src/content/`** — In Astro 6, `src/content/` is reserved for legacy collections. New collections using the Content Layer API (with a `loader`) must store their markdown files outside that folder. We use `/content/recipes/` at the project root.

- **`glob()` base path is relative to project root** — Not relative to the config file. `./content/recipes` resolves from wherever `astro.config.mjs` lives.

- **`npx astro sync` is required after config changes** — Astro generates type declaration files in `.astro/` that VS Code needs to resolve `astro:content`. Run this after any changes to `content.config.ts`.

- **Scoped styles vs global styles** — CSS inside an Astro component's `<style>` block is scoped to that component via a `data-astro-cid` attribute. Global styles from `global.css` can be overridden or blocked by scoped styles. If a global utility class isn't applying inside a component, redefine it in the component's `<style>` block.

- **Global CSS must be imported in frontmatter, not via `@import`** — Using `@import` inside a `<style>` tag in a layout component does not reliably load the stylesheet. The correct pattern is `import '../styles/global.css'` in the component's frontmatter fences.

- **`getStaticPaths()` is required for all dynamic routes** — Any page using `[slug].astro` must export a `getStaticPaths()` function or Astro will throw a build error. This function tells Astro which slugs to generate at build time.

- **`export` keyword outside frontmatter fences crashes the build** — `getStaticPaths()` must live inside the `---` frontmatter block. If the closing `---` is missing, Astro passes the raw JS to esbuild which throws on the `export` keyword with no useful error message pointing to the real cause.

- **JSX attribute syntax in `.map()` blocks is sensitive to copy/paste** — Opening tags (e.g. `<a`) can get silently dropped when inputting code manually, causing attributes like `href={...}` to render as raw text on the page. Always verify the opening tag is present when debugging unexpected raw HTML output.

---

## CSS / Styling

- **`margin-inline` shorthand can silently fail** — In some contexts, using `margin-inline: auto` did not produce centering even with `!important`. Switching to explicit `margin-left: auto` and `margin-right: auto` is more reliable.

- **Section borders vs container borders** — Putting `border-bottom` on a full-width `<section>` makes the line span the entire viewport. To constrain the line to the content width, put the border on the `.container` inside the section instead.

- **Auto margins require a constrained width** — `margin-left: auto` and `margin-right: auto` only center a block element if it has a `max-width` set and the parent is wider than that max-width.

---

## Deployment / Vercel

- **Vercel clones from GitHub — local files must be committed** — Files that exist locally but aren't staged and committed will not be present in the Vercel build. Always `git add . && git commit && git push` before checking Vercel build results.

- **Vercel build logs don't surface all errors** — Some errors (like an empty collection) appear as warnings in the log without failing the build. The page simply won't be generated. Running `npm run build` locally surfaces more detail.

- **Build cache can mask issues** — Vercel caches build output between deploys. If something seems wrong despite a correct commit, check whether the issue predates your last change.

## Data Modeling

- **`yield` is a reserved word in JavaScript** — Destructuring a frontmatter field named `yield` requires aliasing: `const { yield: yieldText } = recipe.data`. Name the variable anything other than `yield`.

- **Checking for MD body content in Astro collections is not straightforward** — There is no simple boolean to check whether a recipe's markdown body has content. Use a `hasNotes: true` frontmatter flag to gate rendering of the notes section rather than trying to inspect the rendered output.

- **Two-field tag model** — Recipe labels are split into `tags` (freeform personal labels like "Hubby's Favorite") and `dietary` (controlled vocabulary slugs like "gluten-free"). Keep these separate to support future filtering by dietary restriction without conflating it with subjective labels.



