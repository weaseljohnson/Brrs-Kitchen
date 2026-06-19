export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': 'brrs_admin_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
      'Location': '/admin/login',
    },
  });
};