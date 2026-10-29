
export async function onRequestGet({ request, env }) {
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response("Falta configurar GITHUB_CLIENT_ID", {
      status: 500
    });
  }

  const state = crypto.randomUUID();
  const callback = new URL("/api/auth/callback", request.url);

  const github = new URL(
    "https://github.com/login/oauth/authorize"
  );

  github.searchParams.set("client_id", clientId);
  github.searchParams.set("redirect_uri", callback.href);
  github.searchParams.set("scope", "public_repo");
  github.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: github.href,
      "Set-Cookie":
        `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600`,
      "Cache-Control": "no-store"
    }
  });
}
