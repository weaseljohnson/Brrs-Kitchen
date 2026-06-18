import type { APIRoute } from 'astro';

export const prerender = false;

const COOKIE_NAME    = 'brrs_admin_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const password = formData.get('password')?.toString() ?? '';

  const correctPassword = import.meta.env.ADMIN_PASSWORD;
  const cookieSecret    = import.meta.env.ADMIN_COOKIE_SECRET;

  if (!correctPassword || !cookieSecret) {
    // Env vars missing — fail loudly in development
    return new Response('Server misconfiguration', { status: 500 });
  }

  if (password !== correctPassword) {
    return redirect('/admin/login?error=1');
  }

  cookies.set(COOKIE_NAME, cookieSecret, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    maxAge:   COOKIE_MAX_AGE,
    path:     '/',
  });

  return redirect('/admin');
};