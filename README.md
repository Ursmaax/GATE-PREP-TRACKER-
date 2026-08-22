# G4Gate — Study Tracker for GATE and DSA Aspirants (clone)

A faithful, fully-working clone of [g4gate.com](https://g4gate.com/) — "The tracking and
preparation ecosystem for GATE and DSA aspirants. Stay consistent, track your progress,
and get where you're going."

Built as a dependency-free single-page application (vanilla HTML/CSS/JS) with a tiny
Node.js static server, so it runs anywhere with zero install.

## Run it

```bash
npm start          # or: node server.mjs
# open http://localhost:3000
```

## What's included

**Public pages (copied verbatim from the live site)**
- `/login` — "Welcome Back", Sign in with Google, username/email + password (Forgot?)
- `/signup` — "Create Account", full name / username / email / password (with the
  3–20 char username rule)
- `/forgot-password` — reset-password flow
- `/about`, `/contact`, `/privacy-policy`, `/terms-and-conditions`,
  `/cancellation-and-refund`, `/shipping-and-delivery`
- `/plans` — "STAY CONSISTENT. CRACK GATE." pricing (₹29/month, ₹129/5 months,
  Free vs Pro comparison table)
- `/thankyou` — the founder's letter + FAQ + usage analytics modal

**App (after sign-in)** — all data saved to `localStorage`
- `/` Dashboard — GATE countdown, study hours, questions solved, streak, syllabus %,
  study heatmap, growth tree, recent sessions
- `/timer` — Pomodoro focus timer (25/50 min, 1/2/3 hour presets) with animated ring,
  subject tracking and auto session logging
- `/syllabus` — the full GATE CSE syllabus, topic-by-topic with progress %
- `/tests` — test series logging + subject-wise analytics
- `/calendar` — monthly study heatmap + manual session logging
- `/leaderboard` — ranked by study hours or questions
- `/notes` — all notes in one place (tags + share)
- `/todos` — advanced to-do list
- `/doubts` — concepts & doubts tracker
- `/pyq` — GATE PYQ Find (curated PYQ-style practice questions)
- `/practice` — rapid-fire practice arena
- `/teachers` — "Konsa Teacher" (choose a resource per subject)
- `/prepare-for-gate` — preparation roadmap
- `/profile` — account info, trial status, data reset

## Notes on the clone

- **Authentication** is simulated client-side (localStorage) — there is no server-side
  DB, real Google OAuth, or real payment gateway. "Sign in with Google" creates a demo
  Google account; checkout buttons open a demo notice; the 21-day free trial is simulated.
- **Design** is a faithful reconstruction (dark, emerald/cyan "G4Gate" brand). The live
  site's dashboard CSS sits behind its login wall and its assets are bot-protected, so the
  exact pixel values weren't retrievable — the layout, copy, pages, footer, feature list
  and pricing were reproduced 1:1 from the public content.
- **Practice questions** are original PYQ-style questions curated to mirror the GATE
  pattern (real exam papers are not reproduced).
