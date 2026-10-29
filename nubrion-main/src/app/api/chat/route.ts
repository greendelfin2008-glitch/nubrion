// Server-side bridge between the website chat and the n8n workflow.
// The browser only ever talks to /api/chat on our own domain, so there are no
// CORS issues and the n8n webhook address never appears in the page source.

const N8N_CHAT_URL =
  process.env.N8N_CHAT_URL ??
  "https://n8n.nubrion.cz/webhook/5c3e0a08-2a8d-4fc2-ab36-94bc3afff940/chat";

const MAX_LEN = 1000;
const FALLBACK = "Omlouvám se, teď se mi nedaří odpovědět. Zkuste to prosím za chvíli, nebo napište na info@nubrion.cz.";

/** n8n can answer with an object or a one-item array; take the first text it carries. */
function pickReply(data: unknown): string | null {
  const item = Array.isArray(data) ? data[0] : data;
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  for (const key of ["output", "text", "odpoved", "reply"]) {
    if (typeof o[key] === "string" && (o[key] as string).trim()) return o[key] as string;
  }
  return null;
}

export async function POST(request: Request) {
  let message = "";
  let sessionId = "";
  try {
    const body = (await request.json()) as { message?: unknown; sessionId?: unknown };
    message = typeof body.message === "string" ? body.message.trim() : "";
    sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : "";
  } catch {
    return Response.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  if (!message || !sessionId) {
    return Response.json({ error: "Chybí zpráva." }, { status: 400 });
  }
  if (message.length > MAX_LEN) {
    return Response.json({ error: `Zpráva je moc dlouhá (max ${MAX_LEN} znaků).` }, { status: 400 });
  }

  try {
    const res = await fetch(N8N_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sendMessage", sessionId, chatInput: message }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    const data: unknown = await res.json().catch(() => null);
    const reply = res.ok ? pickReply(data) : null;
    if (!reply) {
      console.error("n8n chat error", res.status, JSON.stringify(data)?.slice(0, 500));
      return Response.json({ reply: FALLBACK, ok: false });
    }
    return Response.json({ reply, ok: true });
  } catch (err) {
    console.error("n8n chat unreachable", err);
    return Response.json({ reply: FALLBACK, ok: false });
  }
}
