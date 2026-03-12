export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Støtt både JSON og form-data
  let passord;
  const ct = request.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) {
    const body = await request.json();
    passord = body.passord;
  } else {
    const form = await request.formData();
    passord = form.get("passord");
  }

  // Sjekk om passordet finnes i KV
  const count = await env.PASSWORDS.get(passord);

  if (count === null) {
    return Response.redirect(url.origin + "/login?feil=1", 302);
  }

  // Tell opp bruken
  await env.PASSWORDS.put(passord, String(Number(count) + 1));

  // Sett cookie og redirect til forsiden
  return new Response(null, {
    status: 302,
    headers: {
      "Location": url.origin + "/",
      "Set-Cookie": `pw=${passord}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    }
  });
}
