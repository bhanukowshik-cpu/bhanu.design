/* POST /api/chat — the server half of the chat panel.
 *
 * Mirrors proxy.py's handle_chat: take the page's Messages-API body, attach
 * the key server-side, stream the SSE response straight back. The key lives
 * in the ANTHROPIC_API_KEY environment variable (Netlify → Site configuration
 * → Environment variables) and never reaches the browser.
 *
 * Local dev still runs proxy.py on :3001 — index.html points API_BASE there
 * on localhost, so this file only serves the deployed site.
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

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    /* The panel prints this verbatim, so it has to say what to actually do. */
    return json({ error: 'Server is missing ANTHROPIC_API_KEY — add it in Netlify → Site configuration → Environment variables, then redeploy.' }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Malformed request body' }, 400);
  }

  /* proxy.py accepted an apiKey in the body for chat-test.html. A public
     endpoint must not: it would let anyone bill their traffic to a key of
     their choosing through this origin. Drop it and use ours. */
  delete body.apiKey;

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return json({ error: { message: 'Upstream unreachable: ' + e.message } }, 502);
  }

  /* Pass the real status and reason through — the panel reads .error and shows
     it, which beats a blanket "offline" for anything the caller can fix. */
  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': 'application/json', ...CORS },
    });
  }

  /* Hand the body through unbuffered so tokens land as they arrive. */
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      ...CORS,
    },
  });
};

export const config = { path: '/api/chat' };
