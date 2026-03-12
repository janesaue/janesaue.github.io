export async function onRequestPost(context) {
  const { request, env } = context;
  
  const body = await request.json();
  const passord = body.passord;

  // Sjekk om passordet finnes i KV
  const count = await env.PASSWORDS.get(passord);
  
  if (count === null) {
    return new Response("Feil passord", { status: 401 });
  }

  // Tell opp bruken
  await env.PASSWORDS.put(passord, String(Number(count) + 1));

  // Sett cookie og send bruker videre
  return new Response("OK", {
    status: 200,
    headers: {
      "Set-Cookie": `pw=${passord}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    }
  });
}