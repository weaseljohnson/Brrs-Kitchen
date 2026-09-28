import yaml from 'js-yaml';
import { recipeImportSchema, formatIssues, type RecipeImportData } from '../schemas/recipe';

export const MAX_MD_BYTES = 100_000;

// Set by the site on import. If an author includes them we ignore + warn.
const SITE_MANAGED_KEYS = ['draft', 'archived', 'image', 'slug'] as const;

export type ImportedRecipe = Omit<RecipeImportData, 'formatVersion'>;

export type ParseResult =
  | { ok: true;  data: ImportedRecipe; warnings: string[] }
  | { ok: false; errors: string[];     warnings: string[] };

const FRONTMATTER_RE = /^\s*---\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/;

export function parseRecipeMarkdown(raw: string): ParseResult {
  const warnings: string[] = [];
  const fail = (...errors: string[]): ParseResult => ({ ok: false, errors, warnings });

  if (typeof raw !== 'string' || !raw.trim()) return fail('The file is empty.');
  if (Buffer.byteLength(raw, 'utf8') > MAX_MD_BYTES) {
    return fail('The file is too large to be a recipe (limit 100 KB).');
  }

  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = text.match(FRONTMATTER_RE);
  if (!match) {
    return fail('(root): Could not find YAML frontmatter. The file must start with a line containing only --- and have a closing --- line.');
  }

  const [, yamlText, body] = match;
  if (body.trim()) {
    return fail(`(body): Nothing may follow the closing --- (found ${body.trim().length} characters). Put tips in the notes list instead.`);
  }

  let doc: unknown;
  try {
    // CORE_SCHEMA: no timestamp type, so unquoted dates stay strings.
    doc = yaml.load(yamlText, { schema: yaml.CORE_SCHEMA });
  } catch (e) {
    const err = e as yaml.YAMLException;
    const line = err.mark ? ` (near line ${err.mark.line + 2})` : '';
    return fail(`(yaml): Syntax error${line}: ${err.reason ?? err.message}`);
  }

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return fail('(root): Frontmatter must be key: value pairs.');
  }

  const obj = { ...(doc as Record<string, unknown>) };
  for (const key of SITE_MANAGED_KEYS) {
    if (key in obj) {
      delete obj[key];
      warnings.push(`"${key}" is set by the site and was ignored.`);
    }
  }

  const result = recipeImportSchema.safeParse(obj);
  if (!result.success) return fail(...formatIssues(result.error));

  const { formatVersion: _v, ...data } = result.data;

  if (!data.intro) warnings.push('No intro was provided.');
  if (data.ingredients && !data.yield) warnings.push('No yield was provided.');

  return { ok: true, data, warnings };
}