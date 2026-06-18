export const runtime = 'edge';

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-OpenAI-Key',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey =
    request.headers.get('X-OpenAI-Key') ||
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'OpenAI API key not configured' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const formData = await request.formData();

  const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  const result = await upstream.json();
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
