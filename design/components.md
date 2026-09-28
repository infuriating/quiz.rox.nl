# Component inventory

All new building blocks of ROX Live Quiz, built from the ROX tokens. The visual overview with every
state is in `screens/Componenten.dc.html` (and on the canvas, page "Componenten").

## New for the quiz

| Component            | File                                  | States / variants                                                                                                                                                                               | Notes                                                                                                            |
| -------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **AnswerMarker**     | `src/components/AnswerMarker.tsx`     | A triangle, B diamond, C circle, D square; `phone` 44, `admin` 40, `column` 56, `beamer` 96 px; tone `ink`, `inverse`, `accent`, `host`                                                         | Shape plus letter, so an option is never identified by colour alone. Identical on phone and projector.           |
| **AnswerButton**     | `src/components/AnswerButton.tsx`     | `idle`, `selected` (multi-select on), `pressed` (single, just tapped), `correct`, `incorrect` ("Jouw keuze", dashed), `dimmed`, `disabled`; `multi` adds a checkbox on the right                | At least 56 px high; the buttons share the available height. Text 17 px, 15 px above 60 characters, max 4 lines. |
| **AnswerTile**       | `src/components/AnswerTile.tsx`       | `idle`, `correct` (mint, 3 px border, "Goed" label), `dimmed` (38% light / 34% dark); text `option`, `long`, `compact`; optional `count`/`total` for the distribution                           | Projector. No hint at all during the question.                                                                   |
| **CountdownBar**     | `src/components/CountdownBar.tsx`     | running (gradient-signal), last 5 s (`status-warning`), done; `phone` 10 px, `beamer` 20 px                                                                                                     | Cosmetic; derived from `questionEndsAt` with clock-skew correction.                                              |
| **DistributionBar**  | `src/components/DistributionBar.tsx`  | `row` (projector, under the option text), `column` (result without explanation), `admin` (session results); correct = `status-success`, incorrect = neutral                                     | Always shown from the reveal onward, also without scoring.                                                       |
| **LeaderboardRow**   | `src/components/LeaderboardRow.tsx`   | up (success green), down / same (grey, never red); #1 on light blue with a blue rank block                                                                                                      | **Scoring only.**                                                                                                |
| **JoinCodeDisplay**  | `src/components/JoinCodeDisplay.tsx`  | `lg` (lobby), `md`                                                                                                                                                                              | Six separate characters. Codes never contain 0/O or 1/I.                                                         |
| **CodeInput**        | `src/components/CodeInput.tsx`        | default, active cell, error (red, soft ring, instruction below)                                                                                                                                 | One real input rendered as six cells.                                                                            |
| **HostControlBar**   | `src/components/HostControlBar.tsx`   | "Vorige", "Timer overslaan", "Volgende" (the only filled button; label changes to "Tussenstand" / "Afronden"), light/dark, "Sessie beëindigen"; lobby variant with "Start de quiz" on the right | Compact pill at the bottom edge; the join code on the left for late joiners.                                     |
| **ConnectionBanner** | `src/components/ConnectionBanner.tsx` | offline (after 1.5 s), reconnected (visible for 2 s)                                                                                                                                            | Controls underneath are disabled while the connection is down.                                                   |
| **Switch**           | `src/components/Switch.tsx`           | off, on, with hint                                                                                                                                                                              | Real checkbox with `role="switch"`, 44 × 24 px.                                                                  |
| **StatusDisc**       | `src/components/StatusDisc.tsx`       | `success`, `neutral`, `blue`; optional pop animation                                                                                                                                            | Round illustration on the player's result screens.                                                               |

## From the ROX system (rebuilt as markup on the tokens)

| Component                 | File                        | Variants                                                                           |
| ------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| Button (pill)             | `src/components/Button.tsx` | `primary`, `outline`, `ghost`, `ink`; `sm`, `md`, `lg`, `beamer`                   |
| Badge                     | `src/components/Badge.tsx`  | `blue`, `neutral`, `success`, `gradient`, `host`                                   |
| Label (caps)              | `src/components/Label.tsx`  | Space Grotesk 500, 0.08em                                                          |
| Input / Textarea / Select | `src/components/Field.tsx`  | with `hint`, `error` (replaces the hint), `hideLabel`                              |
| Card                      | `src/components/Card.tsx`   | hairline + `shadow-card`                                                           |
| Icon                      | `src/components/Icon.tsx`   | line icons named after Font Awesome, so they can be swapped 1:1 for the ROX FA kit |

## Additions to the ROX system

In `src/styles/app.css`:

- **Projector type scale:** `--text-beamer-*` (22 to 168 px).
- **Phone type scale:** `--text-phone-*`.
- **Host theme:** `--host-*` (light and dark), built entirely from ROX tokens.
- **Derived, not a ROX token:**
  - `--quiz-accent-on-dark` `#7f9bff`, accent text on ink.
  - `--quiz-ok-surface-dark` and `--quiz-ok-text-dark`, green tints for correct on the dark projector.

`src/lib/cn.ts` registers the custom text sizes, radius, shadows, tracking, leading and easing with
the class merger. Add a new `--text-*`, `--radius-*` etc. token there too.
