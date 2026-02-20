import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => (headers[k] = v));

  const buf = await request.arrayBuffer();
  const bodyText = buf.byteLength ? new TextDecoder().decode(buf) : "";

  return new Response(
    JSON.stringify(
      {
        ok: true,
        method: request.method,
        headers,
        bodyByteLength: buf.byteLength,
        bodyText,
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
};
