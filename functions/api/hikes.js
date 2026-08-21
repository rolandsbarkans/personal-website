/* GET every hike, POST a new one, DELETE one with ADMIN_KEY. Needs the D1 binding named DB. */

const MAX_TITLE = 60;
const MAX_NOTE = 400;
const MAX_AUTHOR = 40;
const NOTIFY_TO = 'barkansrolands@gmail.com';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json([]);

  const url = new URL(request.url);
  const admin = env.ADMIN_KEY && url.searchParams.get('key') === env.ADMIN_KEY;

  // never the secret: it is what lets a visitor delete their own hike
  const cols = admin
    ? 'id, lat, lng, title, note, author, country, created_at'
    : 'id, lat, lng, title, note, author, country';

  const { results } = await env.DB
    .prepare(`SELECT ${cols} FROM hikes ORDER BY id DESC LIMIT 1000`)
    .all();

  return json(results || []);
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'no database' }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat > 85 || lat < -85 || lng > 180 || lng < -180) {
    return json({ error: 'bad coordinates' }, 400);
  }

  const title = String(body.title || '').trim().slice(0, MAX_TITLE);
  if (!title) return json({ error: 'the hike needs a name' }, 400);

  const note = String(body.note || '').trim().slice(0, MAX_NOTE);
  const author = String(body.author || '').trim().slice(0, MAX_AUTHOR);

  // an ISO 3166-1 alpha-2 code, or empty
  const country = /^[A-Za-z]{2}$/.test(String(body.country || ''))
    ? String(body.country).toUpperCase()
    : '';

  if (env.TURNSTILE_SECRET) {
    const ok = await verify(body.token, env.TURNSTILE_SECRET,
                            request.headers.get('cf-connecting-ip'));
    if (!ok) return json({ error: 'failed the check' }, 403);
  }

  const secret = String(body.secret || '').slice(0, 64) || crypto.randomUUID();

  const done = await env.DB
    .prepare('INSERT INTO hikes (lat, lng, title, note, author, country, secret) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(lat, lng, title, note, author, country, secret)
    .run();

  await notify(env, { title, note, author, country, lat, lng });

  return json({ ok: true, id: done.meta && done.meta.last_row_id, secret });
}

/* /api/hikes?key=…&id=… */
export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ error: 'no database' }, 503);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isFinite(id)) return json({ error: 'bad id' }, 400);

  if (env.ADMIN_KEY && url.searchParams.get('key') === env.ADMIN_KEY) {
    await env.DB.prepare('DELETE FROM hikes WHERE id = ?').bind(id).run();
    return json({ ok: true, id });
  }

  const secret = url.searchParams.get('secret') || '';
  if (!secret) return json({ error: 'no' }, 403);

  const done = await env.DB
    .prepare('DELETE FROM hikes WHERE id = ? AND secret = ?')
    .bind(id, secret)
    .run();

  if (!done.meta || done.meta.changes < 1) return json({ error: 'no' }, 403);
  return json({ ok: true, id });
}

async function verify(token, secret, ip) {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',
                        { method: 'POST', body: form });
  const out = await r.json();
  return out.success === true;
}

/* A failed send must never lose the hike, so everything here is swallowed. */
async function notify(env, hike) {
  const who = hike.author || 'anonymous hiker';
  const text =
    `${hike.title}\n\n` +
    `${hike.note || '(no note)'}\n\n` +
    `by: ${who}\n` +
    `country: ${hike.country || '(not given)'}\n` +
    `coordinates: ${hike.lat.toFixed(4)}, ${hike.lng.toFixed(4)}\n` +
    `map: https://www.google.com/maps?q=${hike.lat.toFixed(5)},${hike.lng.toFixed(5)}`;

  if (env.DISCORD_WEBHOOK) {
    try {
      await fetch(env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'New hike\n' + text })
      });
    } catch { /* ignored */ }
  }

  if (!env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + env.RESEND_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM || 'onboarding@resend.dev',
        to: env.NOTIFY_EMAIL || NOTIFY_TO,
        subject: 'New hike: ' + hike.title,
        text
      })
    });
  } catch { /* ignored */ }
}
