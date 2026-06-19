import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ── SHARED INGREDIENT TYPES ──
// These are defined here so they can be reused by both top-level
// ingredients and panVariants[].ingredients.

const ingredientItem = z.object({
  count: z.string().optional(),
  item:  z.string(),
});

const ingredientGroup = z.object({
  groupName:   z.string(),
  ingredients: z.array(ingredientItem),
});

// A union: each entry is either a plain item or a named group.
// Zod tries ingredientGroup first — if `groupName` is missing it
// falls through to ingredientItem. Order matters here.
const ingredientEntry = z.union([ingredientGroup, ingredientItem]);

// ── COLLECTION ──
const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/recipes' }),
  schema: z.object({
    title:    z.string(),
    category: z.string(),
    draft:    z.boolean().optional(),   // true = excluded from public site

    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    yield:    z.string().optional(),
    intro:    z.string().optional(),
    pubDate:  z.string().optional(),
    image:    z.string().optional(),

    tags:    z.array(z.string()).optional(),
    dietary: z.array(z.string()).optional(),

    notes: z.array(z.string()).optional(), // replaces hasNotes + MD body

    credit: z.object({
      name: z.string(),
      url:  z.string().url(),
    }).optional(),

    ingredients: z.array(ingredientEntry).optional(),

    panVariants: z.array(z.object({
      id:          z.string(),
      label:       z.string(),
      yield:       z.string(),
      ingredients: z.array(ingredientEntry),
    })).optional(),

    directions: z.array(z.object({
      title: z.string(),
      body:  z.string(),
    })).optional(),

    // Deprecated — kept so old files don't break validation.
    // New recipes use the `notes` array instead.
    hasNotes: z.boolean().optional(),
  }),
});

export const collections = { recipes };