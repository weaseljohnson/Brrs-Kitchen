import { defineMiddleware } from 'astro:middleware';

const PROTECTED_PREFIX = '/admin';
const LOGIN_PATH = '/admin/login';
const COOKIE_NAME = 'brrs_admin_auth';

export const onRequest = defineMiddleware((context, next) => {
  const path = context.url.pathname;

  if (!path.startsWith(PROTECTED_PREFIX) || path === LOGIN_PATH) {
    return next();
  }

  const authCookie = context.cookies.get(COOKIE_NAME);
  const secret = import.meta.env.ADMIN_COOKIE_SECRET;

  if (!authCookie || authCookie.value !== secret) {
    return context.redirect(LOGIN_PATH);
  }

  return next();
});