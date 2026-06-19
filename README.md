# Aptly

> **Live demo:** https://aptly-mu.vercel.app · **API:** https://aptly-app-ausa2.ondigitalocean.app

Paste your CV and a job description, get an honest fit estimate and a grounded
cover letter — on one page.

<!-- TODO: add a screenshot or short GIF of the app here before submitting. -->

---

## What it is

A small web tool for job seekers. You give it two things — your CV (paste it, or
upload a PDF/DOCX that's parsed in your browser) and a job description (JD,
pasted) — and it returns:

- a **fit overlap score** (0–100), labelled honestly as an overlap estimate, **not** a real ATS score;
- **matched skills**, **missing skills**, and **missing keywords**;
- a few concrete **suggestions** to strengthen the CV for that role;
- a **grounded cover letter** — written only from what's actually in your CV — to **copy or download as PDF/DOCX**.

**Who it's for and the one job it does well:** a job seeker tailoring an
application, who wants — in under a minute — to see where they fit, what's
missing, and a first-draft cover letter that doesn't lie about their experience.

## How to run it

Two halves: a Go API (`/api`) and a Next.js frontend (`/web`). You need
**Go 1.25+**, **Node 20+**, and an **OpenAI API key**.

### 1. API (`/api`)

```bash
cd api
cp .env.example .env          # then set OPENAI_API_KEY in .env
go run .                       # serves on http://localhost:8080
```

The API auto-loads `.env` for local dev (via godotenv). In production the host
sets the env vars directly — no `.env` file needed.

Check it: `curl localhost:8080/health` → `{"ok":true}`.

### 2. Frontend (`/web`)

```bash
cd web
npm install
# optional — defaults to http://localhost:8080 if unset:
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev                    # http://localhost:3000
```

Open http://localhost:3000, paste or upload your CV, paste a JD, click **Analyze fit**.

### Environment variables

| Where | Variable | Purpose |
|---|---|---|
| `api` | `OPENAI_API_KEY` | OpenAI key — **server only**, never exposed to the browser. |
| `api` | `ALLOWED_ORIGIN` | CORS allow-list = the frontend origin (your Vercel URL in prod). |
| `api` | `OPENAI_MODEL` | _(optional)_ defaults to `gpt-4o-mini`. |
| `api` | `PORT` | _(optional)_ defaults to `8080`; Render/Fly inject it. |
| `web` | `NEXT_PUBLIC_API_URL` | Public URL of the Go API. Defaults to `localhost:8080`. |

## Architecture

```
[Browser] → Vercel (Next.js UI)
                │  POST { cvText, jdText }   (NEXT_PUBLIC_API_URL)
                ▼
          DigitalOcean / Fly (Go + Gin API)
                │  → OpenAI (grounded prompt → JSON)
                ▼
          analysis JSON → UI renders
```

- **Endpoints:** `GET /health`, `POST /api/analyze`.
- The OpenAI key lives only on the Go server. The browser never sees it.
- Light separation of concerns: the service depends on a small `LLM` interface,
  so the model is swappable and the parsing/grounding logic is unit-tested
  without an API key.
- Stack: Go + Gin + [go-openai], Next.js (App Router, TypeScript, Tailwind).

## Deploy

- **Frontend → Vercel:** project root = `web`. Set `NEXT_PUBLIC_API_URL` to your
  deployed API URL.
- **API → DigitalOcean App Platform** or **Fly.io** (both build `api/Dockerfile`;
  source directory `/api`, HTTP port `8080`). Set `OPENAI_API_KEY` and
  `ALLOWED_ORIGIN` (= your Vercel URL, or the browser will block every call via
  CORS). Don't set `PORT` — the platform injects it.

---

## Product notes

### Why this problem, and how I know it's worth solving

Tailoring each application is tedious, so people either skip it (and send a
generic letter) or burn time per role. This came from my own job-search pain.
A paid market already exists (Jobscan, Teal, Rezi), which is a signal the pain
is real — though I haven't done formal user research yet (see [assumptions](#where-i-didnt-have-answers-and-what-i-assumed)).

### What's already out there, and why I built this anyway

Tools like **Jobscan**, **Teal**, **Rezi**, and **arc.dev** exist — but they're
broader and heavier (full resume builders, dashboards, subscriptions), and many
sell a magic "ATS score." Aptly is deliberately narrow: one page, one job, and
**honest** that the score is just CV↔JD overlap, not a real ATS verdict. The
cover letter is **grounded** — it won't invent skills you don't have.

### What's in scope, what I left out, and why

**In scope:** paste **or upload (PDF/DOCX)** your CV, paste the JD → overlap
score, matched/missing skills, missing keywords, suggestions, grounded cover
letter with copy; per-IP + global rate limits to bound cost on a public,
no-login endpoint.

**Left out (on purpose):**

- **History / a database.** The core job is single-shot, so server-side history
  adds no user value — and dropping it removes a deploy dependency, an env var,
  a failure mode for "the live link must work," and the privacy concern of
  storing people's CVs. (For a prototype, less is better judgment than more.)
- **Importing the JD from a link** (LinkedIn/JobStreet/etc.). Job boards are
  auth-walled, JS-rendered, and anti-scraping, with ToS and SSRF risk — a
  half-working link import reads as broken. The JD stays **paste-only by
  design**; the reliable path (a browser extension that reads the page you
  already have open) is a separate experiment, not server scraping. *(CV upload
  is supported — PDF/DOCX, parsed in your browser.)*
- **Auth / accounts, scraping, auto-apply, full CV rewrite.** Bigger products
  and/or ToS risk — out of scope for a focused prototype.
- **Hardened anti-abuse** (CAPTCHA/Turnstile, WAF, Redis-backed limits). The
  in-memory per-IP limiter bounds the blast radius; production-grade abuse
  protection is a documented next step. The OpenAI dashboard spend cap is the
  real backstop.

### Where I didn't have answers, and what I assumed

- **"ATS score" is a fuzzy construct.** Rather than fake one, I reframed it as an
  honest overlap estimate and labelled it as such in the UI.
- Assumed CV and JD are **English text**. The CV can be **uploaded as PDF/DOCX**
  (parsed in the browser, with the extracted text shown for review) or pasted;
  the JD is pasted. No language detection; scanned/image PDFs aren't OCR'd.
- Assumed **`gpt-4o-mini` quality is good enough** for a prototype.
- **No formal user validation yet** — built from personal pain, to be tested
  with the questions below.

### Three questions I'd ask a real user before building more

1. When you tailor an application today, what's the most painful part — and what
   (if anything) do you use now?
2. Would you actually send an AI-drafted cover letter with light edits, or do you
   only want feedback and prefer to write it yourself?
3. Before applying, do you want a *score*, or do you mainly want to know
   *specifically what's missing* and how to address it?

### How I'd know it's working, and what I'd do next

**Working** = the cover letter is sendable with light edits, and the
missing-skills list matches what a human reviewer would flag — with **zero
invented skills** (the grounding holds). If I added analytics, I'd watch the
cover-letter copy rate, repeat usage, and run a small manual grounding eval.

**Next:** import the JD from a link via a browser extension (reliable, no
scraping), let the user choose a tone, a proper grounding-eval harness, and —
only if users ask for it — optional accounts so they can compare fit across roles.

---

## How I used AI

I built this with **Claude Code** (Anthropic): planning the phases, scaffolding
both halves, writing the Gin handlers, the rate limiter, the React UI, the test
stubs, and a first draft of this README. It compressed hours of boilerplate.

**One thing it got wrong that I caught:** on an early test run, the product's
own model wrote a cover letter that claimed a skill **not present in the CV** —
exactly the failure that would make a tool like this untrustworthy. I caught it
by reading the output against the input, then fixed it two ways: (1) hardened the
grounding system prompt to forbid referencing any missing skill, and (2)
validated the model's JSON server-side — malformed or out-of-range output is
rejected with a `502` instead of being trusted. There's a unit test for the
parse/validate path.

I also steered the assistant away from over-building: it started scaffolding a
Postgres history feature (it was in the plan), and I cut it — a single-shot tool
doesn't need a database.

## Tests

```bash
cd api && go test ./...   # service parse/validate + rate-limiter
cd web && npm run build   # type-check + production build
```

[go-openai]: https://github.com/sashabaranov/go-openai
