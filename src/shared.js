/* Shared helpers for the IEMSS UTHM site manager on Cloudflare Pages.
   Storage is one KV namespace, bound as SITE. Keys:
     auth          bcrypt-style hash of the admin password (PBKDF2)
     secret        random key used to sign session tokens
     content       the live content.json
     backup:<ts>   earlier versions of the content
     photo:<path>  an uploaded photo, as bytes
     photometa     JSON map of photo path -> last-changed timestamp   */

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff' },
  });

const enc = new TextEncoder();

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/* ---------- password hashing (PBKDF2, 150k rounds) ---------- */
export async function hashPassword(password, saltB64) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
  return `${b64(salt)}:${b64(bits)}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt] = stored.split(':');
  const again = await hashPassword(password, salt);
  /* constant-time compare */
  if (again.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < again.length; i++) diff |= again.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

/* ---------- session tokens (signed, stateless, 12 hours) ---------- */
async function signingKey(env) {
  let secret = await env.SITE.get('secret');
  if (!secret) {
    secret = b64(crypto.getRandomValues(new Uint8Array(32)));
    await env.SITE.put('secret', secret);
  }
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function issueToken(env) {
  const body = `${Date.now() + 12 * 3600 * 1000}`;
  const sig = await crypto.subtle.sign('HMAC', await signingKey(env), enc.encode(body));
  return `${body}.${b64(sig)}`;
}

export async function validToken(env, token) {
  if (!token || !token.includes('.')) return false;
  const [body, sig] = token.split('.');
  if (!/^\d+$/.test(body) || Number(body) < Date.now()) return false;
  try {
    return await crypto.subtle.verify('HMAC', await signingKey(env), unb64(sig), enc.encode(body));
  } catch {
    return false;
  }
}

export function bearer(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

export async function needAuth(request, env) {
  if (await validToken(env, bearer(request))) return null;
  return json({ ok: false, error: 'Your session expired. Reload the page and sign in again.' }, 401);
}

/* ---------- content, with the file in the repo as the starting point ---------- */
export async function readContent(env, request) {
  const live = await env.SITE.get('content');
  if (live) return JSON.parse(live);
  const seed = await env.ASSETS.fetch(new Request(new URL('/data/content.seed.json', request.url)));
  return seed.ok ? await seed.json() : null;
}

export async function photoMeta(env) {
  const raw = await env.SITE.get('photometa');
  return raw ? JSON.parse(raw) : {};
}

/* Only these three shapes of path can ever be written to. */
export function resolveSlot(slot) {
  if (slot === 'hero') return 'assets/hero.jpg';
  if (slot === 'committee') return 'assets/committee.jpg';
  const m = /^event:([A-Za-z0-9_-]{1,60}):([123])$/.exec(slot || '');
  return m ? `assets/events/${m[1]}-${m[2]}.jpg` : null;
}
