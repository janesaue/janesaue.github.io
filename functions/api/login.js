export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Hent IP-adresse for rate limiting
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const failKey = "fail:" + ip;

  // Sjekk om IP er blokkert (for mange forsøk)
  const failCount = parseInt(await env.PASSWORDS.get(failKey) || "0");
  if (failCount >= 5) {
    return Response.redirect(url.origin + "/login?blokkert=1", 302);
  }

  // Støtt både JSON og form-data
  let brukernavn, passord;
  const ct = request.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) {
    const body = await request.json();
    brukernavn = body.brukernavn;
    passord = body.passord;
  } else {
    const form = await request.formData();
    brukernavn = form.get("brukernavn");
    passord = form.get("passord");
  }

  if (!brukernavn || !passord) {
    return Response.redirect(url.origin + "/login?feil=1", 302);
  }

  // Hash passordet med SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(passord);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Slå opp bruker i KV (nøkkel: "user:brukernavn", verdi: hashet passord)
  const lagretHash = await env.PASSWORDS.get("user:" + brukernavn);

  if (lagretHash === null || lagretHash !== hashHex) {
    // Feil passord — øk telleren (utløper etter 15 min)
    await env.PASSWORDS.put(failKey, String(failCount + 1), { expirationTtl: 900 });
    return Response.redirect(url.origin + "/login?feil=1", 302);
  }

  // Vellykket innlogging — slett feil-teller
  await env.PASSWORDS.delete(failKey);

  // Lagre engangs-token i KV (utløper etter 60 sek) — lagrer brukernavnet
  const token = crypto.randomUUID();
  await env.PASSWORDS.put("_tok_" + token, brukernavn, { expirationTtl: 60 });

  // Redirect til forsiden med token — middleware setter cookien fra GET
  return Response.redirect(url.origin + "/?tok=" + token, 302);
}
