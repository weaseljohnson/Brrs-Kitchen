import yaml from 'js-yaml';
import type { RecipeData, IngredientEntry, IngredientItem } from '../schemas/recipe';

const KEY_ORDER = [
  'title', 'category', 'pubDate', 'prepTime', 'cookTime', 'yield', 'intro',
  'tags', 'dietary', 'image', 'credit', 'draft', 'archived',
  'ingredients', 'panVariants', 'directions', 'notes',
] as const;

/** YYYY-MM-DD in the site owner's timezone (UTC would roll over at 7–8pm). */
export const todayISO = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Indiana/Indianapolis' });

const toItem = (i: IngredientItem) => ({ count: i.count, item: i.item });

export function normalizeIngredients(list: IngredientEntry[]) {
  return list.map(e =>
    'groupName' in e
      ? { groupName: e.groupName, ingredients: e.ingredients.map(toItem) }
      : toItem(e),
  );
}

/** Recursively drops undefined, blank strings, and empty arrays/objects. */
function prune(v: unknown): unknown {
  if (Array.isArray(v)) {
    const arr = v.map(prune).filter(x => x !== undefined);
    return arr.length ? arr : undefined;
  }
  if (v && typeof v === 'object') {
    const entries = Object.entries(v)
      .map(([k, x]) => [k, prune(x)] as const)
      .filter(([, x]) => x !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (typeof v === 'string') return v.trim() || undefined;
  return v;
}

/** The ONLY place recipe frontmatter is turned into file text. */
export function serializeRecipe(data: Partial<RecipeData>): string {
  const cleaned = (prune({
    ...data,
    draft:    data.draft    === true ? true : undefined,
    archived: data.archived === true ? true : undefined,
    ingredients: data.ingredients && normalizeIngredients(data.ingredients),
    panVariants: data.panVariants?.map(v => ({
      id: v.id, label: v.label, yield: v.yield,
      ingredients: normalizeIngredients(v.ingredients),
    })),
  }) ?? {}) as Record<string, unknown>;

  const ordered: Record<string, unknown> = {};
  for (const key of KEY_ORDER) {
    if (cleaned[key] !== undefined) ordered[key] = cleaned[key];
  }
  return `---\n${yaml.dump(ordered, { lineWidth: -1, noRefs: true })}---\n`;
}