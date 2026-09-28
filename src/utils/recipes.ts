import { getCollection } from 'astro:content';

/** Single source of truth for "what is live on the public site". */
export const getPublishedRecipes = () =>
  getCollection('recipes', ({ data }) => !data.draft && !data.archived);