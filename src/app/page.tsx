"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `ev.${Date.now()}.${Math.random().toString(36).slice(2)}`;
}

function EmailForm({ placement }: { placement: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");

    // Shared id so the Pixel Lead (browser) and CAPI Lead (server) dedupe.
    const eventId = newEventId();
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventId, sourceUrl: window.location.href }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.fbq?.(
          "track",
          "Lead",
          { content_name: "waitlist_signup", content_category: placement },
          { eventID: eventId },
        );
        setStatus("ok");
        setMsg("You're on the list. You'll know first.");
        setEmail("");
      } else {
        setStatus("err");
        setMsg((data as { error?: string }).error ?? "Something went wrong.");
      }
    } catch {
      setStatus("err");
      setMsg("Something went wrong. Try again.");
    }
  }

  return (
    <div>
      <form className="email-form" onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Joining…" : "Get early access"}
        </button>
      </form>
      {status === "ok" || status === "err" ? (
        <p className={`form-msg ${status}`}>{msg}</p>
      ) : (
        <p className="form-note">Free early access · no spam, one launch email</p>
      )}
    </div>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setStickyVisible(heroBottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main>
      <div className="wrap">
        <header className="site-header">
          <a href="/" className="wordmark">
            quiz<em>bowl</em>
          </a>
          <a href="#join" className="header-link">
            Early access →
          </a>
        </header>

        {/* ── Hero ── */}
        <section className="hero" ref={heroRef} id="join">
          <div className="hero-grid">
            <div>
              <span className="eyebrow">Daily training for quizbowl</span>
              <h1>
                Know it <em>first.</em>
              </h1>
              <p className="hero-sub">
                Questions read at real match pace. Buzz ahead of the mark, beat the
                room, and build the depth that wins tournaments — in one focused
                session a day.
              </p>
              <EmailForm placement="hero" />
            </div>

            <div className="tossup" aria-hidden>
              <div className="tossup-head">
                <span>Tossup · Literature</span>
                <span>Daily set 14</span>
              </div>
              <p className="tossup-text">
                <span className="read">
                  This author&rsquo;s late novel about a sign painter was left unfinished at
                  his death. In one work, his title character reads
                </span>
                <span className="buzz-mark">BUZZ</span>
                <span className="unread">
                  books on chivalry until he loses his sanity and recruits a squire named
                  Sancho Panza…
                </span>
              </p>
              <div className="tossup-result">
                <span>Cervantes — correct, 4.2s ahead of the mark</span>
                <span className="pts">+140</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Stat band ── */}
      <div className="stat-band">
        <div className="wrap">
          <p className="big">
            In quizbowl, the difference between first and second place is
            <em> who buzzes first</em>. Knowing isn&rsquo;t enough — reps at match
            pace are how you get there before the other team.
          </p>
        </div>
      </div>

      <div className="wrap">
        {/* ── How it works ── */}
        <section id="how">
          <div className="section-head">
            <span className="eyebrow">The training loop</span>
            <h2>One session a day. Real match conditions.</h2>
          </div>
          <div className="steps">
            <div className="step">
              <span className="num">01</span>
              <h3>Read at match pace</h3>
              <p>
                Tossups reveal word-by-word at the speed a moderator actually reads —
                because studying flashcards at your own pace trains the wrong skill.
              </p>
            </div>
            <div className="step">
              <span className="num">02</span>
              <h3>Buzz ahead of the mark</h3>
              <p>
                Beat the buzz point and earn bonus points — 100 to 140 depending on how
                early you get there. Hesitation costs you, just like on Saturday.
              </p>
            </div>
            <div className="step">
              <span className="num">03</span>
              <h3>Watch your rating climb</h3>
              <p>
                Streaks, ratings, and category breakdowns show exactly where you&rsquo;re
                fast, where you&rsquo;re slow, and what to study next.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        {/* ── Features ── */}
        <section id="features">
          <div className="section-head">
            <span className="eyebrow">Built for the grind</span>
            <h2>Everything the canon demands</h2>
          </div>
          <div className="features">
            <div className="feature">
              <h3>
                <span className="mono">CANON</span>Every category, covered
              </h3>
              <p>
                Literature, history, science, fine arts, myth, and the rest — study the
                whole distribution category by category, not just your comfort zone.
              </p>
            </div>
            <div className="feature">
              <h3>
                <span className="mono">RATING</span>Streaks &amp; ratings
              </h3>
              <p>
                A rating that moves with every session and streaks that keep the daily
                habit honest. Improvement you can point to.
              </p>
            </div>
            <div className="feature">
              <h3>
                <span className="mono">FLAG</span>Challenge bad calls
              </h3>
              <p>
                Think an answer was ruled wrong unfairly? Flag it for review — just like
                protesting a tossup at a real tournament.
              </p>
            </div>
            <div className="feature">
              <h3>
                <span className="mono">TEAM</span>Made for coaches too
              </h3>
              <p>
                Built for players and coaches: see who&rsquo;s putting in reps and where
                the team&rsquo;s category gaps are before the next tournament exposes them.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule" />

        {/* ── FAQ ── */}
        <section id="faq">
          <div className="section-head">
            <span className="eyebrow">Questions</span>
            <h2>Quick answers</h2>
          </div>
          <div className="faq">
            <details>
              <summary>What is this, exactly?</summary>
              <p>
                A daily training app for competitive quizbowl. It reads tossups at real
                match pace and scores you on how early you can buzz with the right answer
                — the skill that actually decides matches.
              </p>
            </details>
            <details>
              <summary>Who is it for?</summary>
              <p>
                High school and college quizbowl players who want to climb, and coaches
                who want their team doing focused reps between practices.
              </p>
            </details>
            <details>
              <summary>What does early access cost?</summary>
              <p>
                Nothing. Join the list and you&rsquo;ll get in free when doors open —
                early users lock in the best deal we&rsquo;ll ever offer.
              </p>
            </details>
            <details>
              <summary>When does it launch?</summary>
              <p>
                Soon — the training engine works today and we&rsquo;re polishing the
                daily sets. The waitlist gets access first, in order.
              </p>
            </details>
          </div>
        </section>
      </div>

      {/* ── Final CTA ── */}
      <div className="stat-band">
        <div className="wrap final" style={{ padding: "96px 24px 104px" }}>
          <h2>
            The other team is studying <em>right now.</em>
          </h2>
          <EmailForm placement="final" />
        </div>
      </div>

      <div className="wrap">
        <footer>
          <span>© {new Date().getFullYear()} quizbowl</span>
          <a href="https://quizapedia.vercel.app">quizapedia.vercel.app</a>
        </footer>
      </div>

      {/* ── Sticky mobile CTA ── */}
      <div className={`sticky-cta${stickyVisible ? " visible" : ""}`}>
        <a href="#join" className="btn">
          Get early access
        </a>
      </div>
    </main>
  );
}
