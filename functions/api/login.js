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

  // Slå opp bruker i KV (nøkkel: "user:brukernavn", verdi: passordet)
  const lagretPassord = await env.PASSWORDS.get("user:" + brukernavn);

  if (lagretPassord === null || lagretPassord !== passord) {
    return Response.redirect(url.origin + "/login?feil=1", 302);
  }

  // Lagre engangs-token i KV (utløper etter 60 sek) — lagrer brukernavnet
  const token = crypto.randomUUID();
  await env.PASSWORDS.put("_tok_" + token, brukernavn, { expirationTtl: 60 });

  // Redirect til forsiden med token — middleware setter cookien fra GET
  return Response.redirect(url.origin + "/?tok=" + token, 302);
}
