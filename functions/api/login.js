export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

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
    return Response.redirect(url.origin + "/login?feil=1", 302);
  }

  // Lagre engangs-token i KV (utløper etter 60 sek) — lagrer brukernavnet
  const token = crypto.randomUUID();
  await env.PASSWORDS.put("_tok_" + token, brukernavn, { expirationTtl: 60 });

  // Redirect til forsiden med token — middleware setter cookien fra GET
  return Response.redirect(url.origin + "/?tok=" + token, 302);
}
