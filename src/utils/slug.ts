/** Single source of truth for URL slugs and folder names. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents: Crème → Creme
    .toLowerCase()
    .replace(/['’]/g, '')            // Brr's → brrs
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const categorySlug = slugify;