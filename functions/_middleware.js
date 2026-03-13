export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Ikke sjekk passord på innloggingssiden og API-ruter
  if (url.pathname === "/login" || url.pathname === "/api/login" || url.pathname === "/api/logout" || url.pathname === "/api/me") {
    return next();
  }

  // Sjekk om det finnes et engangs login-token i URL (satt av /api/login)
  const tok = url.searchParams.get("tok");
  if (tok) {
    const passord = await env.PASSWORDS.get("_tok_" + tok);
    if (passord) {
      // Slett engangs-token
      await env.PASSWORDS.delete("_tok_" + tok);
      // Server selve siden med Set-Cookie på 200-respons (Safari dropper cookies på 302)
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete("tok");
      const pageRequest = new Request(cleanUrl.toString(), request);
      const pageResponse = await env.ASSETS.fetch(pageRequest);
      const newResponse = new Response(pageResponse.body, pageResponse);
      newResponse.headers.set("Set-Cookie", `pw=${encodeURIComponent(passord)}; Path=/; Max-Age=2592000`);
      return newResponse;
    }
  }

  // Sjekk om bruker har gyldig passord i cookie
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/pw=([^;]+)/);
  if (match) {
    const pw = decodeURIComponent(match[1]);
    const count = await env.PASSWORDS.get(pw);
    if (count !== null) {
      return next();
    }
  }

  // Ikke innlogget - send til innloggingsside
  return Response.redirect(url.origin + "/login", 302);
}
