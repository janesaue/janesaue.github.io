export async function onRequestGet(context) {
  const { env } = context;

  const today = new Date().toISOString().split('T')[0];
  const key = 'visits_' + today;

  try {
    const current = await env.PASSWORDS.get(key);
    const count = current ? parseInt(current) : 0;
    await env.PASSWORDS.put(key, String(count + 1));

    return new Response(JSON.stringify({ today: count + 1 }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ today: '–' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
