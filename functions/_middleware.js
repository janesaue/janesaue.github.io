export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Ikke sjekk passord på innloggingssiden og API-ruter
  if (url.pathname === "/login" || url.pathname === "/api/login" || url.pathname === "/api/logout" || url.pathname === "/api/me" || url.pathname === "/api/change-password") {
    return next();
  }

  // Sjekk om det finnes et engangs login-token i URL (satt av /api/login)
  const tok = url.searchParams.get("tok");
  if (tok) {
    const brukernavn = await env.PASSWORDS.get("_tok_" + tok);
    if (brukernavn) {
      // Slett engangs-token
      await env.PASSWORDS.delete("_tok_" + tok);

      // Sjekk om brukeren må bytte passord
      const mustChange = await env.PASSWORDS.get("mustchange:" + brukernavn);
      if (mustChange) {
        // Sett cookie og redirect til endre-passord
        return new Response(null, {
          status: 302,
          headers: {
            "Location": url.origin + "/endre-passord?pliktig=1",
            "Set-Cookie": `pw=${encodeURIComponent(brukernavn)}; Path=/; Max-Age=2592000`
          }
        });
      }

      // Server selve siden med Set-Cookie på 200-respons (Safari dropper cookies på 302)
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete("tok");
      const pageRequest = new Request(cleanUrl.toString(), request);
      const pageResponse = await env.ASSETS.fetch(pageRequest);
      const newResponse = new Response(pageResponse.body, pageResponse);
      newResponse.headers.set("Set-Cookie", `pw=${encodeURIComponent(brukernavn)}; Path=/; Max-Age=2592000`);
      return newResponse;
    }
  }

  // Sjekk om bruker har gyldig brukernavn i cookie
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/pw=([^;]+)/);
  if (match) {
    const brukernavn = decodeURIComponent(match[1]);
    const bruker = await env.PASSWORDS.get("user:" + brukernavn);
    if (bruker !== null) {
      // Sjekk om brukeren må bytte passord
      const mustChange = await env.PASSWORDS.get("mustchange:" + brukernavn);
      if (mustChange && url.pathname !== "/endre-passord") {
        return Response.redirect(url.origin + "/endre-passord?pliktig=1", 302);
      }
      return next();
    }
    // Cookie finnes men er ugyldig — sesjonen har utløpt
    return Response.redirect(url.origin + "/login?utlopt=1", 302);
  }

  // Ikke innlogget - send til innloggingsside
  return Response.redirect(url.origin + "/login", 302);
}
