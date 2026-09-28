import type { APIRoute } from 'astro';
import yaml from 'js-yaml';
import { parseRecipeMarkdown } from '../../utils/recipeImport';
import { serializeRecipe, todayISO } from '../../utils/recipeMarkdown';
import { slugify } from '../../utils/slug';
import { getFile, listPaths, writeFile, GithubConflictError } from '../../utils/github';
import type { RecipeData } from '../../schemas/recipe';

const RECIPES_PREFIX = 'content/recipes/';
const IMAGE_EXTS     = ['jpg', 'jpeg', 'png'];
const MAX_IMAGE_B64  = 3_500_000; // Vercel body limit ≈ 4.5 MB total
const STOPWORDS      = new Set(['the', 'a', 'an']);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// "the-best-brownies" and "best-brownies" share a key → flagged as possible duplicates
const dupKey = (slug: string) =>
  slug.split('-').filter(t => !STOPWORDS.has(t)).join('-');

// ── WHAT'S ALREADY IN THE REPO ──
// 1 tree call + 1 read per category folder (not per recipe), so this stays
// cheap as the cookbook grows.
async function loadRepoIndex() {
  const paths = (await listPaths(RECIPES_PREFIX)).filter(p => p.endsWith('.md'));

  const bySlug = new Map<string, string>();          // slug → repo path
  const firstInFolder = new Map<string, string>();   // folder → one file in it
  for (const p of paths) {
    const parts  = p.split('/');                     // content/recipes/{folder}/{slug}.md
    if (parts.length < 4) continue;
    bySlug.set(parts[3].replace(/\.md$/, ''), p);
    if (!firstInFolder.has(parts[2])) firstInFolder.set(parts[2], p);
  }

  const categories = new Map<string, string>();      // folder → display name
  await Promise.all([...firstInFolder].map(async ([folder, path]) => {
    const file = await getFile(path);
    const m = file?.text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) return;
    const fm = yaml.load(m[1], { schema: yaml.CORE_SCHEMA }) as { category?: unknown } | null;
    if (typeof fm?.category === 'string') categories.set(folder, fm.category);
  }));

  return { bySlug, categories };
}

// ── PARSE + VALIDATE + CHECK CONFLICTS (no writes) ──
async function analyze(markdown: string) {
  const parsed = parseRecipeMarkdown(markdown);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors, warnings: parsed.warnings };

  const data     = { ...parsed.data };
  const warnings = [...parsed.warnings];

  const slug = slugify(data.title);
  if (!slug) {
    return { ok: false as const, errors: ['title: Title must contain letters or numbers.'], warnings };
  }

  const { bySlug, categories } = await loadRepoIndex();

  // Reuse an existing category's exact spelling so "desserts" doesn't become
  // a second category next to "Desserts".
  const existing = categories.get(slugify(data.category));
  if (existing && existing !== data.category) {
    warnings.push(`Category "${data.category}" matched the existing "${existing}". Using "${existing}".`);
    data.category = existing;
  } else if (!existing) {
    warnings.push(`"${data.category}" is a new category and will be created.`);
  }

  const conflictPath = bySlug.get(slug);
  const key = dupKey(slug);
  for (const other of bySlug.keys()) {
    if (other !== slug && dupKey(other) === key) {
      warnings.push(`Possible duplicate of the existing recipe "${other}".`);
    }
  }

  return {
    ok: true as const,
    data,
    slug,
    warnings,
    conflict: conflictPath ? { path: conflictPath } : null,
  };
}

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ errors: ['Request body must be valid JSON.'] }, 400);
  }

  const { action, markdown } = body ?? {};
  if (action !== 'preview' && action !== 'commit') {
    return json({ errors: ['action must be "preview" or "commit".'] }, 400);
  }

  try {
    const result = await analyze(markdown);
    if (!result.ok) {
      return json({ ok: false, errors: result.errors, warnings: result.warnings }, 422);
    }

    const { data, slug, warnings, conflict } = result;

    // ── PREVIEW: report only ──
    if (action === 'preview') {
      return json({
        ok: true,
        slug,
        warnings,
        conflict, // non-null → UI must block the import
        recipe: {
          title:    data.title,
          category: data.category,
          yield:    data.yield ?? null,
          ingredientCount: data.panVariants
            ? data.panVariants.reduce((n, v) => n + v.ingredients.length, 0)
            : (data.ingredients?.length ?? 0),
          variantCount: data.panVariants?.length ?? 0,
          stepCount:    data.directions.length,
        },
      });
    }

    // ── COMMIT ──
    if (conflict) {
      return json({ ok: false, errors: [`A recipe already exists at ${conflict.path}. Nothing was imported.`] }, 409);
    }

    // Default to draft; publishing must be an explicit choice.
    const draft = body.draft !== false;

    const image = body.image;
    if (image) {
      if (!IMAGE_EXTS.includes(image.ext)) {
        return json({ ok: false, errors: ['Image must be a JPG or PNG.'] }, 400);
      }
      if (typeof image.data !== 'string' || image.data.length > MAX_IMAGE_B64) {
        return json({ ok: false, errors: ['Image is too large. Resize it and try again.'] }, 413);
      }
    }

    const recipe: Partial<RecipeData> = {
      ...data,
      pubDate: data.pubDate ?? todayISO(),
      image:   image ? `/images/recipes/${slug}.${image.ext}` : undefined,
      draft,
    };

    // Image first, so the .md commit (which triggers the final build) already
    // has its image. Reverse order can build a page pointing at a missing file.
    if (image) {
      await writeFile(`public/images/recipes/${slug}.${image.ext}`, image.data, {
        isBase64: true,
        mode: 'upsert',
      });
    }

    const mdPath = `${RECIPES_PREFIX}${slugify(data.category)}/${slug}.md`;
    await writeFile(mdPath, serializeRecipe(recipe), { mode: 'create' });

    return json({ ok: true, slug, path: mdPath, draft, warnings });
  } catch (err: any) {
    if (err instanceof GithubConflictError) {
      return json({ ok: false, errors: [err.message] }, 409);
    }
    console.error('[import-recipe]', err);
    return json({ ok: false, errors: [err.message ?? 'Internal server error.'] }, 500);
  }
};