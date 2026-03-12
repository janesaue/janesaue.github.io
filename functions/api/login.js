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

  // Returner HTML-side med cookie — iOS Safari dropper cookies på 302-redirects
  return new Response(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/"></head><body>Logger inn...</body></html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Set-Cookie": `pw=${passord}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
      }
    }
  );
}
