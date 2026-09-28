import { z } from 'astro/zod';

export const DIETARY_FLAGS = [
  'Gluten Free', 'Dairy Free', 'Vegan', 'Vegetarian',
  'Nut Free', 'Egg Free', 'Keto', 'Low Carb',
] as const;

// ── INGREDIENTS ──
const ingredientItem = z.strictObject({
  count: z.string().trim().min(1).optional(),
  item:  z.string().trim().min(1),
});

const ingredientGroup = z.strictObject({
  groupName:   z.string().trim().min(1),
  ingredients: z.array(ingredientItem).min(1),
});

export type IngredientItem  = z.infer<typeof ingredientItem>;
export type IngredientGroup = z.infer<typeof ingredientGroup>;
export type IngredientEntry = IngredientItem | IngredientGroup;

// Dispatches on `groupName` so errors point at the real problem instead of
// a generic "Invalid input" from a z.union. Uses z.any() + a cast (rather than
// z.custom) so Astro's JSON-schema generation for collections doesn't choke.
const ingredientEntry = z.any().superRefine((val, ctx) => {
  const isGroup = val && typeof val === 'object' && 'groupName' in val;
  const res = (isGroup ? ingredientGroup : ingredientItem).safeParse(val);
  if (res.success) return;
  for (const issue of res.error.issues) {
    ctx.addIssue({ code: 'custom', message: issue.message, path: issue.path });
  }
}) as unknown as z.ZodType<IngredientEntry>;

const ingredientList = z.array(ingredientEntry).min(1).superRefine((list, ctx) => {
  const groups = list.filter(e => 'groupName' in e).length;
  if (groups > 0 && groups < list.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cannot mix grouped and ungrouped ingredients. Wrap every entry in a group.',
    });
  }
});

const panVariant = z.strictObject({
  id:          z.string().min(1),
  label:       z.string().min(1),
  yield:       z.string().optional(),
  ingredients: ingredientList,
});

const direction = z.strictObject({
  title: z.string().min(1),
  body:  z.string().min(1),
});

// ── SHARED FIELD SHAPE ──
const shape = {
  title:    z.string().min(1),
  category: z.string().min(1),
  draft:    z.boolean().optional(),
  archived: z.boolean().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  yield:    z.string().optional(),
  intro:    z.string().optional(),
  pubDate:  z.string().optional(),
  image:    z.string().optional(),
  tags:     z.array(z.string()).optional(),
  dietary:  z.array(z.string()).optional(),
  notes:    z.array(z.string()).optional(),
  credit:   z.strictObject({ name: z.string().min(1), url: z.string().url() }).optional(),
  ingredients: ingredientList.optional(),
  panVariants: z.array(panVariant).min(1).optional(),
  directions:  z.array(direction).optional(),
};

// ── SITE SCHEMA (content collection + form saves) ──
// Lenient at the top level so existing files never break the build.
export const recipeSchema = z.object({
  ...shape,
  hasNotes: z.boolean().optional(), // deprecated; legacy files only
});
export type RecipeData = z.infer<typeof recipeSchema>;

// ── IMPORT SCHEMA (strict) ──
// draft / archived / image are set by the site, never authored.
const { draft, archived, image, ...authored } = shape;

const RANGE_RE       = /\d\s*(?:[–—-]|to)\s*\d/i;
const BARE_NUMBER_RE = /^[\d.\s½⅓⅔¼¾⅛⅜⅝⅞⅙⅚]+$/;

type Path = (string | number)[];

function lintCount(count: string | undefined, path: Path, ctx: z.RefinementCtx) {
  if (!count) return;
  if (RANGE_RE.test(count)) {
    ctx.addIssue({ code: 'custom', path, message: `"${count}" contains a range. Pick a single value.` });
  } else if (BARE_NUMBER_RE.test(count)) {
    ctx.addIssue({ code: 'custom', path, message: `"${count}" has no unit. Use a size descriptor, e.g. "2 large" or "3 whole".` });
  }
}

function lintIngredients(list: IngredientEntry[], base: Path, ctx: z.RefinementCtx) {
  list.forEach((entry, i) => {
    if ('groupName' in entry) {
      entry.ingredients.forEach((ing, j) =>
        lintCount(ing.count, [...base, i, 'ingredients', j, 'count'], ctx));
    } else {
      lintCount(entry.count, [...base, i, 'count'], ctx);
    }
  });
}

export const recipeImportSchema = z
  .strictObject({
    ...authored,
    formatVersion: z.literal(1, {
      message: 'Unsupported formatVersion. This importer supports formatVersion: 1.',
    }),
    dietary:    z.array(z.enum(DIETARY_FLAGS)).optional(),
    pubDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'pubDate must be "YYYY-MM-DD".').optional(),
    directions: z.array(direction).min(1),
  })
  .superRefine((r, ctx) => {
    if (r.ingredients && r.panVariants) {
      ctx.addIssue({ code: 'custom', path: ['panVariants'], message: 'Use either ingredients or panVariants, never both.' });
    }
    if (!r.ingredients && !r.panVariants) {
      ctx.addIssue({ code: 'custom', path: ['ingredients'], message: 'Provide ingredients (single pan) or panVariants (multiple pans).' });
    }
    if (r.ingredients) lintIngredients(r.ingredients, ['ingredients'], ctx);
    r.panVariants?.forEach((v, i) => {
      if (!v.yield?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['panVariants', i, 'yield'], message: 'Each pan variant requires a yield.' });
      }
      lintIngredients(v.ingredients, ['panVariants', i, 'ingredients'], ctx);
    });
  });

export type RecipeImportData = z.infer<typeof recipeImportSchema>;

/** `path: message` lines, pasteable straight back into the Claude project. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(i => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
}