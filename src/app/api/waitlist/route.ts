import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// The marketing site's conversion point. One POST does two jobs:
//   1. Forward the email to the quizapedia app's real waitlist.
//   2. Send a Lead event to Meta CAPI with hashed email + browser context.
// The client fires the Pixel Lead with the same eventId, so Meta dedupes.

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export async function POST(request: NextRequest) {
  let body: { email?: string; eventId?: string; sourceUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  // 1. Forward to the real waitlist
  const forwardUrl = process.env.WAITLIST_FORWARD_URL ?? "https://quizapedia.vercel.app/api/v1/waitlist";
  try {
    const res = await fetch(forwardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Something went wrong." },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 502 });
  }

  // 2. Meta CAPI Lead (never blocks the signup result)
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (pixelId && token) {
    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: body.eventId,
          action_source: "website",
          event_source_url: body.sourceUrl,
          user_data: {
            em: [sha256(email)],
            client_ip_address:
              (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined,
            client_user_agent: request.headers.get("user-agent") ?? undefined,
            fbp: request.cookies.get("_fbp")?.value,
            fbc: request.cookies.get("_fbc")?.value,
          },
          custom_data: { content_name: "waitlist_signup" },
        },
      ],
    };
    if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

    fetch(`https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("[META CAPI] Lead failed", err));
  }

  return NextResponse.json({ ok: true });
}
