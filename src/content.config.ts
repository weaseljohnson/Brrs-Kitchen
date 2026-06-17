import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/recipes' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    yield: z.string().optional(),
    intro: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dietary: z.array(z.string()).optional(),
    pubDate: z.string().optional(),
    image: z.string().optional(),
    credit: z.object({
      name: z.string(),
      url:  z.string().url(),
    }).optional(),
    hasNotes: z.boolean().optional(),
    panVariants: z.array(z.object({
      id: z.string(),
      label: z.string(),
      yield: z.string(),
      ingredients: z.array(z.object({
        count: z.string().optional(),
        item:  z.string(),
      })),
    })).optional(),
    directions: z.array(z.object({
      title: z.string(),
      body: z.string(),
    })).optional(),
  }),
});

export const collections = { recipes };