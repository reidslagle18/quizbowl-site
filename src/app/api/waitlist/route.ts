import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { put } from "@vercel/blob";

// The marketing site's conversion point. One POST does three jobs:
//   1. Durably store the lead in this project's own Vercel Blob store.
//   2. Best-effort forward to the quizapedia app's waitlist (its API was
//      500ing for all emails as of 2026-07-21, so it must not be the only
//      copy — leads here are the source of truth until that's fixed).
//   3. Send a Lead event to Meta CAPI with hashed email + browser context.
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

  // 1. Durable copy in our own Blob store. Random suffix keeps the URL
  // unguessable (blobs are public-by-URL); the email hash in the name lets a
  // reader dedupe without opening every file.
  let stored = false;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(
        `leads/${sha256(email).slice(0, 16)}.json`,
        JSON.stringify({ email, at: new Date().toISOString(), source: body.sourceUrl ?? null }),
        { access: "public" },
      );
      stored = true;
    } catch (err) {
      console.error("[WAITLIST] blob store failed", err);
    }
  }

  // 2. Best-effort forward to the real app's waitlist
  let forwarded = false;
  const forwardUrl = process.env.WAITLIST_FORWARD_URL ?? "https://quizapedia.vercel.app/api/v1/waitlist";
  try {
    const res = await fetch(forwardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    forwarded = res.ok;
    if (!res.ok) console.error("[WAITLIST] forward failed", res.status);
  } catch (err) {
    console.error("[WAITLIST] forward errored", err);
  }

  if (!stored && !forwarded) {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 502 });
  }

  // 3. Meta CAPI Lead (never blocks the signup result)
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

    try {
      await fetch(`https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[META CAPI] Lead failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
