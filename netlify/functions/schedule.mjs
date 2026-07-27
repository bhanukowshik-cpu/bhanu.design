/* POST /api/schedule — the meeting-request capture.
 *
 * proxy.py appends these to leads.jsonl on Bhanu's Mac. A function has no
 * durable disk, so the address is handed to Netlify Forms instead: it lands
 * in Site configuration → Forms → meeting-requests, and Netlify emails on
 * each submission once a notification is set up.
 *
 * Netlify only accepts submissions for a form it found in the HTML at deploy
 * time — that is the hidden <form name="meeting-requests"> in index.html.
 * Delete one and the other stops working.
 *
 * No imports on purpose. The site has no build step and no package.json, so
 * anything requiring npm install would not survive a deploy.
 *
 * The contract the panel relies on (index.html, both capture forms): 200 with
 * {ok:true} means the address is safely stored and it may show the
 * confirmation. Anything else and it keeps the field up and tells the visitor
 * to email directly. Never return 200 unless the address actually landed.
 */

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
};

const json = (obj, status) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Malformed request body' }, 400);
  }

  /* Same shape of check proxy.py makes — the page validates too, but this is
     a public endpoint and cannot assume the page is what called it. */
  const email = String(body.email || '').trim();
  if (!email.includes('@') || !email.split('@').pop().includes('.') || email.length > 254) {
    return json({ error: 'Invalid email' }, 400);
  }

  const form = new URLSearchParams({
    'form-name': 'meeting-requests',
    email,
    source: String(body.source || 'voice-panel').slice(0, 60),
    at: new Date().toISOString(),
    ua: (req.headers.get('user-agent') || '').slice(0, 200),
  });

  try {
    const res = await fetch(new URL('/', req.url).toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    /* A 404 here means form detection did not run — the hidden form is
       missing from the deployed HTML. Say so rather than swallowing it;
       a silent failure here loses real leads. */
    if (!res.ok) {
      return json({ error: 'Capture rejected (' + res.status + ') — the meeting-requests form was not detected at deploy time.' }, 502);
    }
  } catch (e) {
    return json({ error: 'Capture unreachable: ' + e.message }, 502);
  }

  return json({ ok: true }, 200);
};

export const config = { path: '/api/schedule' };
