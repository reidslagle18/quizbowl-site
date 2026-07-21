# quizbowl marketing site

Paid-traffic landing page for the quizbowl training app
([quizapedia.vercel.app](https://quizapedia.vercel.app)) with Meta Pixel +
Conversions API tracking.

## Funnel events

| Step | Event | Where it fires |
|---|---|---|
| Page loads | `PageView` + `ViewContent` | Pixel + CAPI, deduped |
| Email joins waitlist | `Lead` (hashed email attached) | Pixel + CAPI, deduped |

Captured emails are stored durably in this project's Vercel Blob store
(`quizbowl-leads`, one JSON file per signup under `leads/`) and forwarded
best-effort to the quizapedia app's `/api/v1/waitlist`.

**Note (2026-07-21):** quizapedia's waitlist API is returning 500 for every
email, so Blob is the source of truth until that's fixed. View leads with
`vercel blob list` (run inside this linked project folder).

## Setup

1. Meta Events Manager → create a Pixel/Dataset (separate from EarnIt's).
2. Pixel Settings → Conversions API → **Generate access token**.
3. Set env vars on Vercel (see `.env.example`).
4. Verify in Events Manager → Test Events, then remove `META_TEST_EVENT_CODE`.

Without the env vars the site works and tracking silently no-ops.
