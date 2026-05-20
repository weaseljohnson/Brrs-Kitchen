import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
  schema: z.object({
    title:       z.string(),
    category:    z.string(),
    prepTime:    z.number(),
    cookTime:    z.number(),
    tags:        z.array(z.string()).optional(),
    image:       z.string().optional(),
    panVariants: z.array(
      z.object({
        label:       z.string(),
        servings:    z.number(),
        ingredients: z.array(z.string()),
      })
    ),
  }),
});

export const collections = { recipes };