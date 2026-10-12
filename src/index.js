/* IEMSS UTHM website — the whole server side, in one Worker.
   Three jobs, then everything else is handed to the static files. */
import { handleApi } from './api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    /* ---- the site manager's API ---- */
    if (path.startsWith('/api/')) {
      return handleApi(request, env, path.slice(5));
    }

    /* ---- the live content ---- */
    if (path === '/data/content.json') {
      const live = env.SITE ? await env.SITE.get('content') : null;
      if (live) {
        return new Response(live, {
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          },
        });
      }
      const seed = await env.ASSETS.fetch(
        new Request(new URL('/data/content.seed.json', request.url)));
      return new Response(seed.body, {
        status: seed.status,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    /* ---- photos: one uploaded through the manager wins over the
           copy that shipped with the site ---- */
    if (path.startsWith('/assets/') && env.SITE) {
      const key = path.slice(1);                      // "assets/events/x-1.jpg"

      const removed = JSON.parse((await env.SITE.get('photosremoved')) || '[]');
      if (removed.includes(key)) return new Response('Not found', { status: 404 });

      const hit = await env.SITE.get(`photo:${key}`, 'arrayBuffer');
      if (hit) {
        return new Response(hit, {
          headers: {
            'content-type': 'image/jpeg',
            /* safe to cache hard — every change bumps the ?v= stamp in the page */
            'cache-control': 'public, max-age=31536000',
          },
        });
      }
    }

    /* ---- everything else is a file that shipped with the site ---- */
    const res = await env.ASSETS.fetch(request);

    if (path.startsWith('/admin')) {
      const h = new Headers(res.headers);
      h.set('x-robots-tag', 'noindex, nofollow');
      h.set('cache-control', 'no-store');
      return new Response(res.body, { status: res.status, headers: h });
    }
    return res;
  },
};
