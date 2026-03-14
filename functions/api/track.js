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

  // Les spillnavn fra request
  const body = await request.json();
  const spill = body.spill;

  if (!spill) {
    return new Response(JSON.stringify({ error: "Mangler spillnavn" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Hent eksisterende statistikk for brukeren
  const statsKey = "stats:" + brukernavn;
  const existing = await env.PASSWORDS.get(statsKey);
  const stats = existing ? JSON.parse(existing) : {};

  // Oppdater statistikk for dette spillet
  const now = new Date().toISOString();
  if (!stats[spill]) {
    stats[spill] = { antall: 0, forste: now, sist: now };
  }
  stats[spill].antall += 1;
  stats[spill].sist = now;

  // Lagre tilbake til KV
  await env.PASSWORDS.put(statsKey, JSON.stringify(stats));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestGet(context) {
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

  // Hent statistikk
  const statsKey = "stats:" + brukernavn;
  const existing = await env.PASSWORDS.get(statsKey);
  const stats = existing ? JSON.parse(existing) : {};

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
