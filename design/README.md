# Ontwerp: referentie-snapshot

**Bron van waarheid is het canvas, niet deze map:**
[ROX Live Quiz op claude.ai](https://claude.ai/artifact/PFFqtCg3ZKJXdvv8nrvBDB) (privé; vraag de eigenaar om toegang).

Deze map is een momentopname, zodat code-review en latere wijzigingen het ontwerp naast de code hebben.

|               |                                                   |
| ------------- | ------------------------------------------------- |
| Snapshot      | 28 september 2026, canvasversie `1790598711-a34a` |
| Design system | ROX Design System, versie `1790200405-cb2f`       |

## Inhoud

- `screens/` bevat de artboards als `.dc.html`-bron (Design Component-formaat van het canvas) en
  `canvas.json` (de indeling: welke artboards, formaat, pagina).
  - Deze bestanden **renderen niet los** in een browser: ze verwachten de runtime (`support.js`) van het canvas.
    Lees ze als HTML-specificatie met exacte maten, kleuren en copy. Alle stijlen staan inline.
- `components.md` is de componenteninventaris met states, gekoppeld aan de bestanden in `src/components/`.
- `tokens.json` is de export van het ROX Design System. `npm run tokens` genereert daaruit
  `src/styles/tokens.css`. Pas die css nooit met de hand aan.

## Van ontwerp naar code

| Artboard (`screens/…`)                                | Route                        | Component / scherm                                          |
| ----------------------------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `Main`, `player/Speler-Join-fout`                     | `/`, `/join/$code`           | `features/player/JoinScreen` + `CodeInput`                  |
| `player/Speler-Lobby`                                 | `/play/$sessionId`           | `LobbyScreen`                                               |
| `player/Speler-Vraag-enkel`, `-meer`, `-meer-gekozen` | idem                         | `QuestionScreen` + `AnswerButton`, `CountdownBar`           |
| `player/Speler-Ontvangen`, `-Te-laat`                 | idem                         | `WaitScreens`                                               |
| `player/Speler-Goed`, `-Helaas` (+ `-score`)          | idem                         | `RevealScreen`                                              |
| `player/Speler-Einde` (+ `-score`)                    | idem                         | `FinalScreen`                                               |
| `player/Speler-Herverbinden`                          | alle speler-routes           | `ConnectionBanner`                                          |
| `host/Host-Pin`                                       | `/host`                      | `features/host/PinScreen`                                   |
| `host/Host-Lobby`                                     | `/host/$sessionId`           | `HostLobby` + `JoinCodeDisplay`                             |
| `host/Host-Vraag`                                     | idem                         | `HostQuestion` + `AnswerTile`, `CountdownBar`               |
| `host/Host-Uitleg`, `host/Host-Resultaat`             | idem                         | `HostReveal` (met / zonder toelichting) + `DistributionBar` |
| `host/Host-Tussenstand`, `host/Host-Podium`           | idem, **alleen met score**   | `HostScoring` + `LeaderboardRow`                            |
| `host/Host-Bedankt`                                   | idem                         | `HostThanks`                                                |
| `host-dark/*`                                         | idem, donkere modus          | dezelfde schermen met `data-theme="dark"`                   |
| `admin/Admin-Quizlijst`                               | `/admin`                     | `routes/admin.index`                                        |
| `admin/Admin-Vraageditor`                             | `/admin/quizzes/$quizId`     | `QuestionForm`, `QuizSettings` + `Switch`                   |
| `admin/Admin-Sessieresultaten`                        | `/admin/sessions/$sessionId` | `routes/admin.sessions.$sessionId` + CSV-exports            |
| `Componenten`                                         | n.v.t.                       | zie `components.md`                                         |

## Bewuste afwijkingen van deze snapshot

De app is generiek, zodat hij ook voor andere quizzen werkt. Het ontwerp bevat nog voorbeeldcopy van
de ISO-training:

- **Joinscherm:**
  - De ondertitel is generiek. "ISO 27001 awarenesstraining." is weggelaten.
  - De voetregel noemt "deelname aan deze quiz" in plaats van "de training".
- **Beamer:**
  - Het label boven "Doe mee op je telefoon" en op Iedereen bedankt is de titel van de quiz.
  - De URL is het echte host-adres in plaats van `quiz.rox.nl`.
  - De QR-code is echt (`qrcode.react`) in plaats van de placeholder.
- **Spelerschermen:**
  - Er staat "deelnemers" in plaats van "collega's".
  - "Om te onthouden" toont de **afsluitende boodschap** uit de quizinstellingen, en verdwijnt als die leeg is.
- **Host-bedieningsbalk:** er is een licht/donker-knop bijgekomen.
- **Beheer:**
  - De Quizlijst heeft geen kolom Host: de app kent geen hostaccounts.
  - Bij een sessie brengt de knop "Bekijk resultaten en exporteer CSV" je naar de sessieresultaten.
    Daar staan beide exports (deelname en verdeling).

## Snapshot verversen

Als het canvas verandert: lees de gewijzigde artboards opnieuw uit het canvas, vervang ze in `screens/`
en werk de snapshotregel bovenaan bij. Commit ontwerp en code bij voorkeur samen, zodat de diff laat
zien wat er aan de UI hoort te veranderen.
