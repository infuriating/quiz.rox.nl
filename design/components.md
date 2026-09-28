# Componenteninventaris

Alle nieuwe bouwstenen van ROX Live Quiz, opgebouwd uit de ROX-tokens. Het visuele overzicht met alle
states staat in `screens/Componenten.dc.html` (en op het canvas, pagina Componenten).

## Nieuw voor de quiz

| Component            | Bestand                               | States / varianten                                                                                                                                                                | Notities                                                                                                            |
| -------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **AnswerMarker**     | `src/components/AnswerMarker.tsx`     | A driehoek, B ruit, C cirkel, D vierkant; `phone` 44, `admin` 40, `column` 56, `beamer` 96 px; tone `ink`, `inverse`, `accent`, `host`                                            | Vorm plus letter, zodat een optie nooit alleen op kleur herkenbaar is. Op telefoon en beamer identiek.              |
| **AnswerButton**     | `src/components/AnswerButton.tsx`     | `idle`, `selected` (meerkeuze aan), `pressed` (enkel, net getikt), `correct`, `incorrect` ("Jouw keuze", gestippeld), `dimmed`, `disabled`; `multi` voegt een checkbox rechts toe | Minimaal 56 px hoog; de knoppen delen de beschikbare hoogte. Tekst 17 px, 15 px boven 60 tekens, maximaal 4 regels. |
| **AnswerTile**       | `src/components/AnswerTile.tsx`       | `idle`, `correct` (mint, 3 px lijn, Goed-label), `dimmed` (38% licht / 34% donker); tekst `option`, `long`, `compact`; optioneel `count`/`total` voor de verdeling                | Beamer. Geen enkele hint tijdens de vraag.                                                                          |
| **CountdownBar**     | `src/components/CountdownBar.tsx`     | loopt (gradient-signal), laatste 5 s (`status-warning`), op; `phone` 10 px, `beamer` 20 px                                                                                        | Cosmetisch; afgeleid van `questionEndsAt` met klokcorrectie.                                                        |
| **DistributionBar**  | `src/components/DistributionBar.tsx`  | `row` (beamer, onder de optietekst), `column` (resultaat zonder toelichting), `admin` (sessieresultaten); goed = `status-success`, fout = neutraal                                | Altijd zichtbaar vanaf de reveal, ook zonder score.                                                                 |
| **LeaderboardRow**   | `src/components/LeaderboardRow.tsx`   | omhoog (success-groen), omlaag / gelijk (grijs, nooit rood); nummer 1 op light blue met blauw rangblok                                                                            | **Alleen met score aan.**                                                                                           |
| **JoinCodeDisplay**  | `src/components/JoinCodeDisplay.tsx`  | `lg` (lobby), `md`                                                                                                                                                                | Zes losse tekens. Codes bevatten nooit 0/O of 1/I.                                                                  |
| **CodeInput**        | `src/components/CodeInput.tsx`        | standaard, actief vakje, fout (rood, zachte ring, instructie eronder)                                                                                                             | Eén echte input met zes zichtbare cellen.                                                                           |
| **HostControlBar**   | `src/components/HostControlBar.tsx`   | Vorige, Timer overslaan, Volgende (enige gevulde knop, label wisselt: Tussenstand / Afronden), licht/donker, Sessie beëindigen; lobbyvariant met "Start de quiz" rechts           | Compacte pill aan de onderrand; links de joincode voor laatkomers.                                                  |
| **ConnectionBanner** | `src/components/ConnectionBanner.tsx` | offline (na 1,5 s), weer verbonden (2 s zichtbaar)                                                                                                                                | Knoppen eronder zijn uitgeschakeld zolang de verbinding weg is.                                                     |
| **Switch**           | `src/components/Switch.tsx`           | uit, aan, met hint                                                                                                                                                                | Echte checkbox met `role="switch"`, 44 × 24 px.                                                                     |
| **StatusDisc**       | `src/components/StatusDisc.tsx`       | `success`, `neutral`, `blue`; optionele pop-animatie                                                                                                                              | Ronde illustratie op de resultaatschermen van de speler.                                                            |

## Uit het ROX-systeem (als markup nagebouwd op de tokens)

| Component                 | Bestand                     | Varianten                                                                            |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Button (pill)             | `src/components/Button.tsx` | `primary`, `outline`, `ghost`, `ink`; `sm`, `md`, `lg`, `beamer`                     |
| Badge                     | `src/components/Badge.tsx`  | `blue`, `neutral`, `success`, `gradient`, `host`                                     |
| Label (caps)              | `src/components/Label.tsx`  | Space Grotesk 500, 0.08em                                                            |
| Input / Textarea / Select | `src/components/Field.tsx`  | met `hint`, `error` (vervangt de hint), `hideLabel`                                  |
| Card                      | `src/components/Card.tsx`   | hairline + `shadow-card`                                                             |
| Icon                      | `src/components/Icon.tsx`   | lijniconen met Font Awesome-namen, zodat ze 1:1 te vervangen zijn door de ROX FA-kit |

## Toevoegingen aan het ROX-systeem

Staan in `src/styles/app.css`:

- **Beamer-typeschaal:** `--text-beamer-*` (22 tot 168 px).
- **Telefoon-typeschaal:** `--text-phone-*`.
- **Host-thema:** `--host-*` (licht en donker), volledig opgebouwd uit ROX-tokens.
- **Afgeleid, geen ROX-token:**
  - `--quiz-accent-on-dark` `#7f9bff`, accenttekst op ink.
  - `--quiz-ok-surface-dark` en `--quiz-ok-text-dark`, groentinten voor goed op de donkere beamer.
