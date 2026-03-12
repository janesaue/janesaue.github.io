export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Ikke sjekk passord på innloggingssiden
  if (url.pathname === "/login" || url.pathname === "/api/login") {
    return next();
  }

  // Sjekk om bruker har gyldig passord i cookie
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/pw=([^;]+)/);
  if (match) {
    const pw = match[1];
    const count = await env.PASSWORDS.get(pw);
    if (count !== null) {
      return next();
    }
  }

  // Ikke innlogget - send til innloggingsside
  return Response.redirect(url.origin + "/login", 302);
}