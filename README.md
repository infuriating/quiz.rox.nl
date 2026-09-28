# ROX Live Quiz

A live quiz for one room. The host screen runs on a projector and players answer on their phones.
The first use is ROX's internal ISO 27001 awareness training, but the app is generic: everything
ISO-specific lives in the seed data only. The UI is in Dutch.

- **Scoring is optional per quiz and off by default.** With scoring off there are no points,
  ranks, leaderboard or podium.
- **The answer distribution** (how many players picked each option) is always tracked and shown.
- **A maximum number of participants** is optional per quiz. When set, the lobby shows "van N"
  and anyone joining after that is told the quiz is full.
- **Sessions expire** after 1 hour without a host action (configurable per quiz up to 4 hours),
  and can be deleted from `/admin`.

Stack: TanStack Start + TanStack Router, React Query via `@convex-dev/react-query`, Convex,
Tailwind CSS v4 (themed from the ROX tokens), strict TypeScript, Vite+ (oxlint, oxfmt).

## Setup

```bash
npm install
npx convex dev
```

On first run, `npx convex dev` asks you to log in and pick or create a project. It writes
`CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` to `.env.local`.

To run locally without a Convex account:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev
```

## Host PIN

The host screens and `/admin` are protected by a single PIN (4 to 6 digits), checked server-side:

```bash
npx convex env set HOST_PIN 123456
```

## Seed data

```bash
npx convex run seed:seed
```

This creates the quiz "ISO 27001 Training" with scoring off. The seed is idempotent by title, so
running it again does nothing. It logs a warning for any question marked `_todo` or without a
correct answer.

> A session can only start when every non-poll question has a correct answer.

## Running

```bash
npm run dev
```

This starts `convex dev` and the web app on <http://localhost:3000>.

| Route               | For                                                       |
| ------------------- | --------------------------------------------------------- |
| `/`                 | Players: enter code, name and email                       |
| `/join/<code>`      | Players via the QR code; the code is prefilled            |
| `/play/<sessionId>` | Players during the game                                   |
| `/host`             | Host: PIN, pick a quiz, open the lobby                    |
| `/host/<sessionId>` | Projector (1920×1080, scales to any screen)               |
| `/admin`            | Admin: quizzes, questions, settings, results, CSV exports |

## Running a session

1. Open `/host` on the laptop connected to the projector and enter the PIN.
2. Pick a quiz and click **"Open de lobby"**. The join code, URL and a QR code appear.
3. Players scan the QR code, or go to the URL and enter the code. Their names appear live.
4. Click **"Start de quiz"**. For each question:
   - **Result:** shown automatically when time is up or everyone has answered.
     **"Timer overslaan"** jumps there straight away.
   - **"Volgende"** goes to the next question. With scoring on, the leaderboard comes first.
   - **"Vorige"** goes back to the previous result.
   - **"Sessie beëindigen"** ends the session immediately.
5. The moon/sun icon in the control bar switches between light and dark. The choice is remembered
   per device.

Players who refresh their phone or lose wifi rejoin the same session automatically (their player ID
is kept in `localStorage`). Joining again with the same email in the same session returns the same
player.

## Turning scoring on or off

Go to `/admin`, choose **"Vragen bewerken"** for the quiz, and in **"Quizinstellingen"** switch
**"Score en tussenstand"** on or off. Then click **"Instellingen opslaan"**. The setting applies to
new sessions: a session captures the quiz settings when its lobby opens.

With scoring on:

- A correct answer earns 500 points plus up to a 500-point speed bonus, linear over the time limit.
- Multi-select questions must match the correct set exactly.
- Polls earn no points.

## Session expiry and deletion

- **Expiry:** a session ends (status "Verlopen") after a period without host activity. Every host
  action restarts the clock, so a long training does not expire halfway. The default is 1 hour; set
  **"Sessie verloopt na"** in the quiz settings to up to 4 hours, e.g. for a quiz with presentations
  in between. Results and exports of an expired session are kept, and its join code becomes free.
- **Deletion:** **"Verwijderen"** on a session in `/admin` (or on its results page) removes the
  session with all its players and answers. It disappears immediately; the data is purged in the
  background in batches.

## Exports

Per session (`/admin` → **"Bekijk resultaten en exporteer CSV"**):

- **Participation CSV:**
  - Columns: session date, quiz, name, email, number of questions answered, and per question
    correct / incorrect / not answered.
  - A `score` column only when the session was played with scoring on.
  - For the ISO 27001 training, this is the training record for the auditor.
- **Distribution CSV:** per question and option, the option text, whether it is correct, and how
  many players picked it, plus the number of players who did not answer.

## Hosting (Cloudflare Workers + Convex)

The app is built as a single-page app: every route renders in the browser, and all data and
realtime updates go over a WebSocket straight to Convex. `npm run build` therefore produces only
static files in `dist/client`, with `index.html` as the shell.

`wrangler.jsonc` describes an assets-only Cloudflare Worker. Unknown paths (`/play/…`, `/host/…`,
`/admin/…`) get the shell via `not_found_handling: "single-page-application"`. Cloudflare does not
bill static asset requests as Worker invocations.

One-time setup:

1. Log in to Convex and create a production deployment (`npx convex login`, then
   `npx convex deploy`).
2. Set the host PIN on production:

   ```bash
   npx convex env set HOST_PIN 123456 --prod
   ```

3. Seed the quiz on production:

   ```bash
   npx convex run seed:seed --prod
   ```

4. Log in to Cloudflare:

   ```bash
   npx wrangler login
   ```

Deploy:

```bash
npm run deploy
```

This first deploys the Convex functions and builds the frontend with the production
`VITE_CONVEX_URL` (`convex deploy --cmd`), then uploads the assets to Cloudflare (`wrangler deploy`).
Attach a custom domain in the Cloudflare dashboard. The URL and QR code on the projector pick up
the address automatically.

To try the production build locally:

```bash
npm run preview
```

This builds the app and serves `dist/client` with `wrangler dev` on <http://localhost:8787>.

## Checks

Tooling runs through [Vite+](https://viteplus.dev/) (`vp`) with oxlint and oxfmt. The config lives
in `vite.config.ts`.

| Script           | What it does                                            |
| ---------------- | ------------------------------------------------------- |
| `npm run check`  | Formatting, lint and type check in one go (`vp check`)  |
| `npm run lint`   | Oxlint, including the type-aware rules and Convex rules |
| `npm run format` | Format with oxfmt                                       |
| `npm run build`  | Type check and production build                         |

A pre-commit hook (`.vite-hooks`) runs `vp check --fix` on staged files.

## Design

`design/` holds a reference snapshot of the design:

- the artboards as `.dc.html` source;
- the component inventory;
- the ROX `tokens.json`.

The canvas remains the source of truth. See `design/README.md` for the link, the design-to-code map
and the intentional deviations. After a change to the ROX tokens:

```bash
npm run tokens
```

## Project structure

```
design/            design snapshot (see design/README.md)
scripts/           generate-tokens.mjs
convex/
  schema.ts        tables and indexes
  sessions.ts      PIN, session creation, joining, player and host views (sanitized)
  game.ts          phase transitions, scheduled auto-reveal and expiry
  answers.ts       answer submission and evaluation (only here, on server time)
  admin.ts         quizzes, questions, settings, results, session deletion
  seed.ts          ISO 27001 seed
  lib/             auth, scoring, data helpers, flow, join codes, limits
src/
  styles/tokens.css   ROX tokens (generated from the design system)
  styles/app.css      Tailwind theme, projector scale, light/dark for the host
  components/         one component per item in the component inventory
  features/           screens per surface (player, host, admin)
  routes/             file-based routes
```

### Backend rules

- **Before the reveal:** correct answers, the explanation and the distribution only reach a client
  from the `reveal` phase onward, including the projector. During a question, only the host gets
  the "X / N beantwoord" count.
- **Evaluating answers:** only `submitAnswer` does this, on server time. Late answers, second
  answers and answers in the wrong phase are rejected.
- **Score and rank:** with scoring off, the queries do not return these fields (`null`), not `0`.
- **Fan-out:** during a question, a phone's view does not read other players' answers or scores, so
  one answer re-runs only the host view and the answering player's own view.
