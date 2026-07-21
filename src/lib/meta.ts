// Client-side Meta event helper.
//
// Every browser-visible event fires TWICE with the same event_id:
//   1. Meta Pixel (fbq)            — browser signal
//   2. POST /api/meta → Conversions API — server signal
// Meta deduplicates the pair on (event_name, event_id) within 48h, so ad
// optimization sees one event with the best of both signals.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "InitiateCheckout"
  | "CompleteRegistration"
  | "StartTrial"
  | "Subscribe";

function newEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `ev.${Date.now()}.${Math.random().toString(36).slice(2)}`;
}

export function metaTrack(
  eventName: MetaEventName,
  customData?: Record<string, string | number>,
  options?: { email?: string },
): string {
  const eventId = newEventId();

  if (typeof window !== "undefined") {
    if (window.fbq) {
      window.fbq("track", eventName, customData ?? {}, { eventID: eventId });
    }

    // Server copy via CAPI relay. sendBeacon survives page navigation, which
    // matters for CTA clicks that immediately leave the page.
    const payload = JSON.stringify({
      eventName,
      eventId,
      customData: customData ?? {},
      sourceUrl: window.location.href,
      email: options?.email,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/meta", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }

  return eventId;
}

// Fire the signup-click Lead, then hand the visitor to the app with ad
// attribution intact (fbclid + UTMs pass through so the app domain can set
// _fbc and attribute CompleteRegistration/StartTrial back to the ad).
export function trackSignupClick(signupUrl: string, placement: string): void {
  metaTrack("Lead", { content_name: "signup_click", content_category: placement });

  const target = new URL(signupUrl);
  const here = new URLSearchParams(window.location.search);
  for (const key of ["fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = here.get(key);
    if (v) target.searchParams.set(key, v);
  }

  // Small delay lets the pixel's own network call get out the door.
  window.setTimeout(() => {
    window.location.href = target.toString();
  }, 150);
}
