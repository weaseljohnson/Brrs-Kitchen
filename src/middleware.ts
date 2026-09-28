import { defineMiddleware } from 'astro:middleware';

const LOGIN_PATH = '/admin/login';
const COOKIE_NAME = 'brrs_admin_auth';

// API routes that must stay reachable without an admin session.
const PUBLIC_API_PREFIXES = ['/api/ratings/', '/api/admin-login'];

function isAuthed(context: Parameters<Parameters<typeof defineMiddleware>[0]>[0]): boolean {
  const secret = import.meta.env.ADMIN_COOKIE_SECRET;
  const cookie = context.cookies.get(COOKIE_NAME);
  return Boolean(secret) && cookie?.value === secret;
}

export const onRequest = defineMiddleware((context, next) => {
  const path = context.url.pathname;

  // API: return 401 JSON (a redirect makes no sense for fetch calls)
  if (path.startsWith('/api/')) {
    if (PUBLIC_API_PREFIXES.some(p => path.startsWith(p))) return next();
    if (!isAuthed(context)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return next();
  }

  // Admin pages: redirect to login
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  if (isAdmin && path !== LOGIN_PATH && !isAuthed(context)) {
    return context.redirect(LOGIN_PATH);
  }

  return next();
});