/* The site manager's API. Everything the dashboard does lands here. */
import {
  json, hashPassword, verifyPassword, issueToken, needAuth,
  readContent, photoMeta, resolveSlot,
} from './shared.js';

const KEEP_BACKUPS = 30;

export async function handleApi(request, env, action) {

  if (!env.SITE) {
    return json({ ok: false, error: 'Storage is not connected. In Cloudflare, bind a KV namespace named SITE to this project, then redeploy.' }, 500);
  }

  /* Only read the body as JSON when it actually is JSON — an upload is
     multipart, and reading it here would leave nothing for formData(). */
  const isJson = (request.headers.get('content-type') || '').includes('application/json');
  const body = request.method === 'POST' && isJson
    ? await request.json().catch(() => ({}))
    : {};

  switch (action) {

    /* ---- is a password set yet? ---- */
    case 'status': {
      const has = !!(await env.SITE.get('auth'));
      return json({ ok: true, configured: has });
    }

    /* ---- first run ---- */
    case 'setup': {
      if (await env.SITE.get('auth')) {
        return json({ ok: false, error: 'A password is already set.' }, 400);
      }
      if (!body.password || body.password.length < 8) {
        return json({ ok: false, error: 'Use at least 8 characters.' }, 400);
      }
      await env.SITE.put('auth', await hashPassword(body.password));
      return json({ ok: true, token: await issueToken(env) });
    }

    /* ---- sign in ---- */
    case 'login': {
      const stored = await env.SITE.get('auth');
      if (!stored) return json({ ok: false, error: 'No password has been set yet.' }, 400);
      if (!(await verifyPassword(body.password || '', stored))) {
        await new Promise((r) => setTimeout(r, 400));
        return json({ ok: false, error: 'Wrong password.' }, 401);
      }
      return json({ ok: true, token: await issueToken(env) });
    }

    /* ---- everything below needs a valid session ---- */
    case 'load': {
      const stop = await needAuth(request, env); if (stop) return stop;
      const content = await readContent(env, request);
      if (!content) return json({ ok: false, error: 'The starting content file is missing from the deployment.' }, 500);

      /* photos that shipped with the site, plus anything uploaded since */
      const photos = {};
      const shipped = await env.ASSETS.fetch(new Request(new URL('/data/photos.seed.json', request.url)));
      if (shipped.ok) {
        for (const p of await shipped.json().catch(() => [])) photos[p] = 1;
      }
      Object.assign(photos, await photoMeta(env));
      for (const gone of JSON.parse((await env.SITE.get('photosremoved')) || '[]')) delete photos[gone];

      return json({ ok: true, content, photos });
    }

    case 'save': {
      const stop = await needAuth(request, env); if (stop) return stop;
      const data = body.content;
      if (!data || typeof data !== 'object') {
        return json({ ok: false, error: 'That did not arrive as valid content. Nothing was saved.' }, 400);
      }
      for (const k of ['hero', 'about', 'contact', 'upcoming', 'past', 'org', 'roster']) {
        if (!(k in data)) {
          return json({ ok: false, error: `Save refused: the '${k}' section was missing. Nothing was changed.` }, 400);
        }
      }

      /* keep the version we are about to replace — on the first save that is
         the content the site shipped with, which is exactly what someone would
         want to get back to */
      let previous = await env.SITE.get('content');
      if (!previous) {
        const seed = await readContent(env, request);
        if (seed) previous = JSON.stringify(seed);
      }
      if (previous) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        await env.SITE.put(`backup:${stamp}`, previous, { expirationTtl: 60 * 60 * 24 * 180 });
        const list = await env.SITE.list({ prefix: 'backup:' });
        const extra = list.keys.map((k) => k.name).sort().reverse().slice(KEEP_BACKUPS);
        await Promise.all(extra.map((name) => env.SITE.delete(name)));
      }

      data.rev = Math.floor(Date.now() / 1000);
      await env.SITE.put('content', JSON.stringify(data));
      return json({
        ok: true,
        saved: new Date().toLocaleString('en-GB', {
          timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short',
          year: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
      });
    }

    /* ---- a photo, already resized by the browser ---- */
    case 'upload': {
      const stop = await needAuth(request, env); if (stop) return stop;
      const form = await request.formData().catch(() => null);
      if (!form) return json({ ok: false, error: 'No photo arrived.' }, 400);

      const file = form.get('file');
      const path = resolveSlot(form.get('slot'));
      if (!path) return json({ ok: false, error: 'Unknown photo slot.' }, 400);
      if (!file || typeof file === 'string') return json({ ok: false, error: 'No photo arrived.' }, 400);

      const bytes = await file.arrayBuffer();
      if (bytes.byteLength > 6 * 1024 * 1024) {
        return json({ ok: false, error: 'That photo is still too large after resizing. Try a different one.' }, 400);
      }
      /* must really be a JPEG — the browser re-encodes everything to JPEG before sending */
      const head = new Uint8Array(bytes.slice(0, 3));
      if (!(head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff)) {
        return json({ ok: false, error: 'That file is not an image.' }, 400);
      }

      await env.SITE.put(`photo:${path}`, bytes);
      const removed = JSON.parse((await env.SITE.get('photosremoved')) || '[]').filter((p) => p !== path);
      await env.SITE.put('photosremoved', JSON.stringify(removed));
      const meta = await photoMeta(env);
      meta[path] = Math.floor(Date.now() / 1000);
      await env.SITE.put('photometa', JSON.stringify(meta));
      return json({ ok: true, path, stamp: meta[path] });
    }

    case 'delete_photo': {
      const stop = await needAuth(request, env); if (stop) return stop;
      const path = resolveSlot(body.slot);
      if (!path) return json({ ok: false, error: 'Unknown photo slot.' }, 400);
      await env.SITE.delete(`photo:${path}`);
      const meta = await photoMeta(env);
      delete meta[path];
      await env.SITE.put('photometa', JSON.stringify(meta));

      const removed = new Set(JSON.parse((await env.SITE.get('photosremoved')) || '[]'));
      removed.add(path);
      await env.SITE.put('photosremoved', JSON.stringify([...removed]));
      return json({ ok: true });
    }

    case 'backups': {
      const stop = await needAuth(request, env); if (stop) return stop;
      const list = await env.SITE.list({ prefix: 'backup:' });
      const backups = list.keys
        .map((k) => k.name.slice(7))
        .sort().reverse()
        .map((stamp) => {
          const iso = stamp.replace(/-/g, (m, i) => (i === 4 || i === 7 ? '-' : i === 10 ? 'T' : ':')) + 'Z';
          const d = new Date(iso);
          return {
            file: stamp,
            when: isNaN(d) ? stamp : d.toLocaleString('en-GB', {
              timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short',
              year: 'numeric', hour: '2-digit', minute: '2-digit',
            }),
          };
        });
      return json({ ok: true, backups });
    }

    case 'restore': {
      const stop = await needAuth(request, env); if (stop) return stop;
      const old = await env.SITE.get(`backup:${body.file}`);
      if (!old) return json({ ok: false, error: 'That backup is gone.' }, 404);
      const now = await env.SITE.get('content');
      if (now) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        await env.SITE.put(`backup:${stamp}`, now, { expirationTtl: 60 * 60 * 24 * 180 });
      }
      const data = JSON.parse(old);
      data.rev = Math.floor(Date.now() / 1000);
      await env.SITE.put('content', JSON.stringify(data));
      return json({ ok: true });
    }

    case 'password': {
      const stop = await needAuth(request, env); if (stop) return stop;
      const stored = await env.SITE.get('auth');
      if (!(await verifyPassword(body.old || '', stored))) {
        return json({ ok: false, error: 'The current password is wrong.' }, 401);
      }
      if (!body.new || body.new.length < 8) {
        return json({ ok: false, error: 'Use at least 8 characters.' }, 400);
      }
      await env.SITE.put('auth', await hashPassword(body.new));
      return json({ ok: true });
    }

    default:
      return json({ ok: false, error: 'Unknown action.' }, 400);
  }
}
