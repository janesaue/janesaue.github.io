export async function onRequestPost(context) {
  const { request, env } = context;

  // Finn brukernavnet fra cookie
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/pw=([^;]+)/);
  if (!match) {
    return new Response(JSON.stringify({ error: "Ikke innlogget" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const brukernavn = decodeURIComponent(match[1]);

  // Les gammelt og nytt passord fra request
  const body = await request.json();
  const { gammeltPassord, nyttPassord } = body;

  if (!gammeltPassord || !nyttPassord) {
    return new Response(JSON.stringify({ error: "Mangler passord" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Hash gammelt passord og sjekk mot KV
  const encoder = new TextEncoder();
  const gammelHash = Array.from(new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(gammeltPassord))
  )).map(b => b.toString(16).padStart(2, "0")).join("");

  const lagretHash = await env.PASSWORDS.get("user:" + brukernavn);

  if (lagretHash === null || lagretHash !== gammelHash) {
    return new Response(JSON.stringify({ error: "Feil nåværende passord" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Hash nytt passord og lagre
  const nyHash = Array.from(new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(nyttPassord))
  )).map(b => b.toString(16).padStart(2, "0")).join("");

  await env.PASSWORDS.put("user:" + brukernavn, nyHash);

  // Fjern tvunget passordbytte-flagg
  await env.PASSWORDS.delete("mustchange:" + brukernavn);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
