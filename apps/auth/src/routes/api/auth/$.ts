import { createAPIFileRoute } from "@tanstack/start/api";

const getTargetApiUrl = (): string => {
  const envUrl = process.env.VITE_PUBLIC_API_URL || process.env.VITE_API_URL;
  if (
    typeof envUrl === "string" &&
    envUrl.trim() !== "" &&
    !envUrl.includes("PLACEHOLDER") &&
    (envUrl.startsWith("http://") || envUrl.startsWith("https://"))
  ) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://localhost:3002";
};

async function handleProxyRequest({ request, params }: { request: Request; params: { _splat?: string } }) {
  const targetApi = getTargetApiUrl();
  const splat = params._splat || "";

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${targetApi}/auth/${splat}${incomingUrl.search}`);

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete("host");

  const method = request.method;
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer();

  try {
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstreamResponse.headers);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { message: "Auth service proxy error: " + (error?.message || "Unknown error") } }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: handleProxyRequest,
  POST: handleProxyRequest,
  PUT: handleProxyRequest,
  PATCH: handleProxyRequest,
  DELETE: handleProxyRequest,
});
