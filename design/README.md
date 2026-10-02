# Design: reference snapshot

**The source of truth is the canvas, not this folder:**
[ROX Live Quiz on claude.ai](https://claude.ai/artifact/PFFqtCg3ZKJXdvv8nrvBDB) (private; ask the owner for access).

This folder is a point-in-time snapshot, so code review and later changes have the design next to
the code.

|               |                                              |
| ------------- | -------------------------------------------- |
| Snapshot      | 28 September 2026, canvas version 10         |
| Design system | ROX Design System, version `1790200405-cb2f` |

## Contents

- `screens/` holds the artboards as `.dc.html` source (the canvas's Design Component format) and
  `canvas.json` (the layout: which artboards, their size, page).
  - These files **do not render on their own** in a browser: they expect the canvas runtime
    (`support.js`). Read them as an HTML spec with exact sizes, colours and copy. All styles are inline.
- `components.md` is the component inventory with states, mapped to the files in `src/components/`.
- `tokens.json` is the ROX Design System export. `npm run tokens` generates
  `src/styles/tokens.css` from it. Never edit that CSS by hand.

The copy in the artboards is Dutch, like the app's UI.

## Design to code

| Artboard (`screens/…`)                                | Route                        | Component / screen                                            |
| ----------------------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| `Main`, `player/Speler-Join-fout`                     | `/`, `/join/$code`           | `features/player/JoinScreen` + `CodeInput`                    |
| `player/Speler-Lobby`                                 | `/play/$sessionId`           | `LobbyScreen`                                                 |
| `player/Speler-Vraag-enkel`, `-meer`, `-meer-gekozen` | same                         | `QuestionScreen` + `AnswerButton`, `CountdownBar`             |
| `player/Speler-Ontvangen`, `-Te-laat`                 | same                         | `WaitScreens`                                                 |
| `player/Speler-Goed`, `-Helaas` (+ `-score`)          | same                         | `RevealScreen`                                                |
| `player/Speler-Einde` (+ `-score`)                    | same                         | `FinalScreen`                                                 |
| `player/Speler-Herverbinden`                          | all player routes            | `ConnectionBanner`                                            |
| `player-desktop/*` (1440 × 900)                       | same, from 768 px wide       | the same player screens: `PhoneFrame` card, 2×2 answer grid   |
| `host/Host-Pin` (host password)                       | `/host`                      | `features/host/PasswordScreen`                                |
| `host/Host-Lobby`                                     | `/beamer/$sessionId`         | `HostLobby` + `JoinCodeDisplay`                               |
| `host/Host-Vraag`                                     | same                         | `HostQuestion` + `AnswerTile`, `CountdownBar`                 |
| `host/Host-Uitleg`, `host/Host-Resultaat`             | same                         | `HostReveal` (with / without explanation) + `DistributionBar` |
| `host/Host-Tussenstand`, `host/Host-Podium`           | same, **scoring only**       | `HostScoring` + `LeaderboardRow`                              |
| `host/Host-Bedankt`                                   | same                         | `HostThanks`                                                  |
| Canvas "Manage Quiz Session" (`Beheer-*`)             | `/host/$sessionId`           | `features/manage/ManageDashboard` + `cards`                   |
| `host-dark/*`                                         | same, dark mode              | the same screens with `data-theme="dark"`                     |
| `admin/Admin-Quizlijst`                               | `/admin`                     | `routes/admin.index`                                          |
| `admin/Admin-Vraageditor`                             | `/admin/quizzes/$quizId`     | `QuestionForm`, `QuizSettings` + `Switch`                     |
| `admin/Admin-Sessieresultaten`                        | `/admin/sessions/$sessionId` | `routes/admin.sessions.$sessionId` + CSV exports              |
| `Componenten`                                         | n/a                          | see `components.md`                                           |

## Intentional deviations from this snapshot

The app is generic so it works for other quizzes too. The design still contains sample copy from
the ISO training:

- **Join screen:**
  - The subtitle is generic; "ISO 27001 awarenesstraining." is dropped.
  - The footer mentions "deelname aan deze quiz" instead of "de training".
- **Projector:**
  - The label above "Doe mee op je telefoon" and on "Iedereen bedankt" is the quiz title.
  - The URL is the real host address instead of `quiz.rox.nl`.
  - The QR code is real (`qrcode.react`) instead of the placeholder.
- **Player screens:**
  - They say "deelnemers" instead of "collega's".
  - "Om te onthouden" shows the **closing message** from the quiz settings, and is hidden when it is
    empty.
  - "Antwoord ontvangen" shows waiting dots instead of the live "9 / 15" counter. A live count on
    every phone re-runs every phone's query on each answer; the host keeps the counter.
  - The final screen says "Deze sessie is verlopen" when a session expired.
- **Phone join screen:** the subtitle is "Vul de code in en speel mee." (no "vanaf je telefoon"), as
  on the desktop join screen, since players can join from a laptop too.
- **Host controls:** the control bar on the projector screens is gone. All controls, including the
  light/dark toggle, live on the separate manage screen (`/host/$sessionId`, the "Manage Quiz
  Session" canvas), so the shared beamer screen (`/beamer/$sessionId`) has none.
- **Admin:**
  - The quiz list has no Host column: the app has no host accounts.
  - The session status can be "Bezig", "Afgerond", "Beëindigd" or "Verlopen", and each session has
    a "Verwijderen" button.
  - For a session, "Bekijk resultaten en exporteer CSV" opens the session results, which hold both
    exports (participation and distribution).
  - The quiz settings have "Sessie verloopt na" (1 to 4 hours) instead of the "Toelichting na elke
    vraag" switch.
  - The session results show the date the session is deleted automatically (one year after it was
    played).
  - Each quiz shows "Actief" or "Inactief" and has "Zet inactief" / "Activeer" and "Verwijderen".
    The design's "Concept" status does not exist; an inactive quiz covers that case.

## Refreshing the snapshot

When the canvas changes: read the changed artboards from the canvas again, replace them in
`screens/`, and update the snapshot line at the top. Preferably commit design and code together, so
the diff shows what the UI is meant to change.
