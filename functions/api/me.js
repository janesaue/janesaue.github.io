export async function onRequestGet(context) {
  const { request, env } = context;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/pw=([^;]+)/);

  if (!match) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const brukernavn = decodeURIComponent(match[1]);
  const bruker = await env.PASSWORDS.get("user:" + brukernavn);

  if (bruker === null) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ user: brukernavn }), {
    headers: { "Content-Type": "application/json" }
  });
}
