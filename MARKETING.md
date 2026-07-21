# quizbowl — Marketing Playbook

The complete paid-acquisition scheme for the quizbowl training app
(quizapedia.vercel.app, brands as "quizbowl — know it first"). The dedicated
marketing website was intentionally decommissioned; this playbook plus the
tracking code in this repo is what carries forward. If a landing page is
needed again, `vercel --prod` from this repo brings it back as-is.

## 1. Positioning

**One-liner:** The daily training app for quizbowl — questions at real match
pace, because knowing isn't enough. You have to know it first.

- **Category:** competitive training tool (like Chess.com puzzles or Duolingo
  streaks), NOT a study/flashcard app. Flashcards train recall; quizbowl is
  won on *speed under pressure* — own that difference in every ad.
- **Emotional hook:** the buzzer race. Losing a tossup you *knew* because
  someone else got there first is the sharpest pain in the sport. Every
  creative should poke it: "You knew it. They buzzed first."

## 2. Audiences (in priority order)

1. **Players (HS/college), 13–22.** Self-motivated grinders. Reach on
   Instagram/TikTok placements via Meta Advantage+ (interests: quiz bowl,
   Jeopardy!, academic teams, trivia). They convert on competitiveness:
   ratings, streaks, "ahead of the mark" bragging rights.
2. **Coaches/teachers.** One coach = 10–30 players. Convert on visibility:
   who's putting in reps, where the team's category gaps are. Facebook feed +
   teacher groups. Higher CPA is fine — LTV is a whole team.
3. **Parents of academic-team kids.** Secondary. Frame as the academic
   equivalent of a batting cage — deliberate practice, measurable improvement.

## 3. Funnel

Pre-launch (now): ad → quizapedia landing → email waitlist = **Lead**.
Post-launch: ad → landing → account = **CompleteRegistration** → first
session = **StartTrial** (or custom `FirstSession`) → paid = **Subscribe**.

The tracking implementation is already written in this repo and ports
directly onto quizapedia:

- `src/components/MetaPixel.tsx` — pixel loader (PageView + ViewContent,
  CAPI-deduped)
- `src/app/api/meta/route.ts` — Conversions API relay (event_id dedup,
  hashed email, fbp/fbc/IP/UA enrichment)
- `src/app/api/waitlist/route.ts` — waitlist capture firing a `Lead` with
  hashed email (highest-quality match signal)

Env vars per `.env.example`: `NEXT_PUBLIC_META_PIXEL_ID`,
`META_CAPI_ACCESS_TOKEN`, optional `META_TEST_EVENT_CODE`. Use a pixel
separate from EarnIt's.

⚠️ **Blocker:** quizapedia's `/api/v1/waitlist` 500s on every email
(verified 2026-07-21) — its landing form is losing all signups. Fix before
spending a dollar on ads. Backup leads captured by this repo live in the
`quizbowl-leads` Vercel Blob store (`vercel blob list` in this folder).

## 4. Campaign structure (Meta)

- **Advantage+ Sales campaign**, optimize to `Lead` pre-launch, then
  `CompleteRegistration` → `Subscribe` as volume allows (need ~50
  events/week per ad set before graduating to a deeper event).
- Seasonality: quizbowl runs Sept–May (nationals in spring). Load budget
  Aug–Oct (season prep) and Jan–Mar (nationals push). Summer = cheap
  waitlist-building.
- Budget test plan: start $20–30/day, 3–4 creative angles, kill anything
  above 2× the best CPA after ~2k impressions each.

## 5. Ad angles to test

1. **The lost buzz** — "You knew it. They buzzed first." (players)
2. **Match pace** — side-by-side: reading a packet at your own speed vs the
   moderator's pace. "Practice how you play." (players/coaches)
3. **The rating climb** — screen-record of a rating going up over a week of
   dailies. Numbers going up sells itself. (players)
4. **Coach visibility** — "You can't be at every kid's kitchen table.
   Now you can see who did their reps." (coaches)
5. **Streak identity** — "Day 47. The other team doesn't know you exist
   yet." (players, dark/late-night aesthetic matching the brand)

Creative notes: dark UI screenshots with the amber buzz marker are the brand;
15–30s screen-capture video beats static for app ads; put the actual product
(tossup revealing word-by-word, then BUZZ) in the first 2 seconds.

## 6. Non-paid channels (cheap wins first)

- **Discord/Reddit:** r/quizbowl and the big quizbowl Discords are where the
  whole community lives. Seed free early access there before paying Meta.
- **hsquizbowl.org forums:** coaches read these. One honest "I built a
  match-pace trainer, here's free access" post outperforms ad spend.
- **Tournament sponsorship:** small local tournaments accept prize/sponsor
  slots cheaply — a QR code in front of exactly the right 200 people.
- **Coach referral loop (build later):** coach invites team → team joins
  free → coach dashboard unlocks. The K-factor is the real growth engine.
