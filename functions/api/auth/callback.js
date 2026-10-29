
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = request.headers.get("Cookie") || "";
  const savedState = cookies
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith("oauth_state="))
    ?.slice("oauth_state=".length);

  if (!code || !state || !savedState || state !== savedState) {
    return new Response("Autorización inválida o vencida", {
      status: 403
    });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response("Falta configuración de GitHub", {
      status: 500
    });
  }

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "AlejandroRinconDesignCMS"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    return new Response("No se pudo autorizar GitHub", {
      status: 401
    });
  }

  const origin = url.origin;
  const message = JSON.stringify({
  token: data.access_token,
  provider: "github"
});

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  const message = ${JSON.stringify(message)};
  if (window.opener) {
    window.opener.postMessage(
  "authorization:github:success:" + message,
  ${JSON.stringify(origin)}
);
setTimeout(() => window.close(), 1000);
  } else {
    document.body.textContent =
      "Autorización completada. Puedes cerrar esta ventana.";
  }
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie":
        "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0"
    }
  });
}
