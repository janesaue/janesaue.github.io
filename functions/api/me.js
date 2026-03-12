export async function onRequestGet(context) {
  const { request, env } = context;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/pw=([^;]+)/);

  if (!match) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const pw = match[1];
  const count = await env.PASSWORDS.get(pw);

  if (count === null) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ user: pw }), {
    headers: { "Content-Type": "application/json" }
  });
}
