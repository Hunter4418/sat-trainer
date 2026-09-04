# Drill — personal SAT trainer

A single-user SAT practice app: pulls real questions from the College Board
SAT Suite Question Bank, grades your answer, shows the rationale, and keeps
a running record of your accuracy by domain so you can see what's actually
weak. Built as a PWA — add it to your iPhone home screen and it opens like
a normal app.

## Run it locally

```
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

```
npm install -g vercel   # if you don't have it
vercel
```

Follow the prompts (link/create a project, accept defaults). No environment
variables are needed — there's no login, no database; everything lives in
your phone's local storage.

## Add to your iPhone home screen

1. Open the deployed URL in Safari (must be Safari, not Chrome, for this to work on iOS).
2. Tap the Share icon -> Add to Home Screen.
3. It'll open full-screen, no browser chrome, using the icon in `public/`.

## How your data is stored

Everything - every question you've answered, right or wrong, and your two
official scores - lives in `localStorage` in your phone's browser. Nothing
is sent to a server or database. That means:
- It's private to your device.
- Clearing Safari's site data wipes your history.
- It won't sync between your phone and a laptop. If you want that later,
  swap `src/lib/storage.ts` for a small hosted key-value store (Vercel KV /
  Upstash Redis are the easiest add - say the word and I'll wire it in).

Your two official scores (March 2026: 1370, August 2026: 1300) are seeded
as defaults in `src/lib/storage.ts` (`DEFAULT_BASELINES`) - edit that array
to add your October result once you have it, or to adjust the March/August
numbers.

## About the College Board integration - read this if questions stop loading

`satsuitequestionbank.collegeboard.org` has no official public API.
`src/lib/collegeboard.ts` calls the same undocumented endpoints the site's
own frontend uses (`qbank-api.collegeboard.org/.../get-questions` and
`.../get-question`). This was built and type-checked without any way to
hit `collegeboard.org` from the build sandbox, so the exact field names in
the response are my best-documented guess, not something I ran live.

If you deploy this and questions fail to load, it's almost certainly a
field-name mismatch, and it's a five-minute fix:

1. Open `satsuitequestionbank.collegeboard.org` in Chrome, search for any
   question.
2. DevTools -> Network -> filter `Fetch/XHR`, open a question.
3. You'll see calls to `qbank-api.collegeboard.org/.../get-questions` and
   `.../get-question`. Click one, check the Payload and Response tabs.
4. In `src/lib/collegeboard.ts`, update `buildListBody()` / the `field()`
   lookups in `listQuestions()` and `getQuestionDetail()` to match whatever
   key names you actually see.

Everything else (storage, stats, UI) doesn't depend on College Board's
exact schema and won't need touching.

## Project layout

- `src/lib/collegeboard.ts` - the question-bank client (server-only)
- `src/app/api/next-question/route.ts` - picks a question matching your
  filters, excluding ones you've seen recently
- `src/lib/storage.ts` - localStorage read/write + accuracy-by-domain math
- `src/components/QuestionView.tsx` - question + choices + grading
- `src/components/StatsPanel.tsx` - dashboard
- `src/app/page.tsx` - ties it together, subject/domain filters, "focus
  weak areas" toggle (weights questions toward your lowest-accuracy domains
  once you've answered at least 3 in that domain)
