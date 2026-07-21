import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Server-side relay to Meta's Conversions API. The browser sends the event
// with the same event_id it gave the Pixel; Meta dedupes the pair. The server
// enriches with what only it can see reliably: client IP, user agent, and the
// _fbp/_fbc cookies (sent unhashed, per Meta spec).

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Lead",
  "InitiateCheckout",
  "CompleteRegistration",
  "StartTrial",
  "Subscribe",
]);

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export async function POST(request: NextRequest) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return NextResponse.json({ ok: true, skipped: "no pixel configured" });

  let body: {
    eventName?: string;
    eventId?: string;
    customData?: Record<string, string | number>;
    sourceUrl?: string;
    email?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (!body.eventName || !ALLOWED_EVENTS.has(body.eventName)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const userData: Record<string, unknown> = {
    client_ip_address: (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined,
    client_user_agent: request.headers.get("user-agent") ?? undefined,
    fbp: request.cookies.get("_fbp")?.value,
    fbc: request.cookies.get("_fbc")?.value,
  };
  if (body.email) userData.em = [sha256(body.email)];

  const event = {
    event_name: body.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.eventId,
    action_source: "website",
    event_source_url: body.sourceUrl,
    user_data: userData,
    custom_data: body.customData ?? {},
  };

  const payload: Record<string, unknown> = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error("[META CAPI]", res.status, await res.text());
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[META CAPI] network error", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
