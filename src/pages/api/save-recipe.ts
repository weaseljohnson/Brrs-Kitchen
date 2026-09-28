import type { APIRoute } from 'astro';
import { recipeSchema, formatIssues, type RecipeData } from '../../schemas/recipe';
import { serializeRecipe, todayISO } from '../../utils/recipeMarkdown';
import { slugify } from '../../utils/slug';
import { writeFile, listPaths, GithubConflictError } from '../../utils/github';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_EXTS = ['jpg', 'jpeg', 'png'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// ── REQUEST VALIDATION (transport-level; content rules live in the schema) ──
function validatePayload(p: any): string[] {
  const errors: string[] = [];
  if (!p || typeof p !== 'object')  return ['Invalid request body.'];
  if (!p.title?.trim())             errors.push('Title is required.');
  if (!p.category?.trim())          errors.push('Category is required.');
  if (!p.slug?.trim())              errors.push('Slug is required.');
  else if (!SLUG_RE.test(p.slug))   errors.push('Slug may only contain lowercase letters, numbers and hyphens.');
  if (!p.directions?.length)        errors.push('At least one direction step is required.');
  if (p.image?.data && !IMAGE_EXTS.includes(p.image.ext)) {
    errors.push('Image must be a JPG or PNG.');
  }
  return errors;
}

// ── FORM PAYLOAD → RECIPE DATA ──
function payloadToRecipe(p: any): Partial<RecipeData> {
  const usingVariants = Array.isArray(p.panVariants) && p.panVariants.length > 0;
  return {
    title:    p.title,
    category: p.category,
    pubDate:  p.pubDate ?? todayISO(),
    prepTime: p.prepTime,
    cookTime: p.cookTime,
    intro:    p.intro,
    tags:     p.tags,
    dietary:  p.dietary,
    notes:    p.notes,
    credit:   p.credit?.name && p.credit?.url ? { name: p.credit.name, url: p.credit.url } : undefined,
    draft:    p.draft,
    archived: p.archived,
    image:    p.image?.ext ? `/images/recipes/${p.slug}.${p.image.ext}` : p.existingImagePath,
    yield:       usingVariants ? undefined : p.yield,
    ingredients: usingVariants ? undefined : p.ingredients,
    panVariants: usingVariants ? p.panVariants : undefined,
    directions:  p.directions,
  };
}

export const POST: APIRoute = async ({ request }) => {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ errors: ['Request body must be valid JSON.'] }, 400);
  }

  const errors = validatePayload(payload);
  if (errors.length) return json({ errors }, 400);

  // Validate against the site schema BEFORE committing. A malformed recipe
  // file fails the whole Vercel build, so never write one.
  const parsed = recipeSchema.safeParse(payloadToRecipe(payload));
  if (!parsed.success) return json({ errors: formatIssues(parsed.error) }, 400);

  // mode: 'create' (new recipe form) refuses to overwrite. Anything else
  // keeps the old upsert behavior so the edit page works unchanged.
  const mode = payload.mode === 'create' ? 'create' : 'upsert';
  const slug = payload.slug as string;

  try {
    // Routes are /recipes/[slug], so a slug must be unique across ALL category
    // folders, not just the target folder.
    if (mode === 'create') {
      const clash = (await listPaths('content/recipes/'))
        .find(p => p.endsWith(`/${slug}.md`));
      if (clash) {
        return json({ error: `A recipe with the URL "${slug}" already exists (${clash}).` }, 409);
      }
    }

    // Image first: the .md commit is last, so the build it triggers already
    // has the image. (Reverse order builds a page pointing at a missing file.)
    if (payload.image?.data) {
      await writeFile(`public/images/recipes/${slug}.${payload.image.ext}`, payload.image.data, {
        isBase64: true,
        mode: 'upsert', // an orphan at this exact slug belongs to this recipe
      });
    }

    const mdPath = `content/recipes/${slugify(payload.category)}/${slug}.md`;
    await writeFile(mdPath, serializeRecipe(parsed.data), { mode });

    return json({ ok: true, slug, path: mdPath });
  } catch (err: any) {
    if (err instanceof GithubConflictError) return json({ error: err.message }, 409);
    console.error('[save-recipe]', err);
    return json({ error: err.message ?? 'Internal server error.' }, 500);
  }
};