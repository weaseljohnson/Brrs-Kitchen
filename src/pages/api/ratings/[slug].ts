import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

// ── 1. FORCE DYNAMIC ROUTING ──
// This ensures Astro never tries to compile this as a static file.
export const prerender = false; 

const redis = new Redis({
  url:   import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

type RatingData = { total: number; count: number };

// ── GET — return current average and count ──
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  const data = await redis.get<RatingData>(`rating:${slug}`);

  if (!data || data.count === 0) {
    return json({ average: 0, count: 0 });
  }

  return json({
    average: data.total / data.count,
    count:   data.count,
  });
};

// ── POST — submit a rating (1–5) ──
export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;

  let body: { rating?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const rating = body.rating;
  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: 'Rating must be an integer between 1 and 5.' }, 400);
  }

  const key  = `rating:${slug}`;
  const prev = (await redis.get<RatingData>(key)) ?? { total: 0, count: 0 };
  const next: RatingData = {
    total: prev.total + rating,
    count: prev.count + 1,
  };

  await redis.set(key, next);

  return json({
    average: next.total / next.count,
    count:   next.count,
  });
};

// ── HELPER ──
function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      // ── 2. PREVENT CACHING ──
      // Forces browsers and CDNs to always fetch the live rating
      'Cache-Control': 'no-store, max-age=0, must-revalidate'
    },
  });
}