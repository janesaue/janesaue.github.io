export async function onRequestPost(context) {
  return new Response("OK", {
    status: 200,
    headers: {
      "Set-Cookie": "pw=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
    }
  });
}
