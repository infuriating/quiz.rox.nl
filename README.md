# ROX Live Quiz

Een live quiz voor één zaal: het hostscherm draait op de beamer, spelers antwoorden op hun telefoon.
De eerste toepassing is de interne ISO 27001-awarenesstraining, maar de app is generiek: alles wat
ISO-specifiek is staat alleen in de seed-data.

- **Score is optioneel per quiz en staat standaard uit.** Zonder score zijn er geen punten, posities,
  tussenstand of podium.
- **De antwoordverdeling** (hoeveel spelers welke optie kozen) wordt altijd bijgehouden en getoond.
- **Maximaal aantal deelnemers** is optioneel per quiz. Staat het aan, dan toont de lobby "van N"
  en krijgt wie daarna aanmeldt de melding dat de quiz vol is.

Stack: TanStack Start + TanStack Router, React Query via `@convex-dev/react-query`, Convex,
Tailwind CSS v4 (thema uit de ROX-tokens), TypeScript strict.

## Installeren

```bash
npm install
npx convex dev
```

`npx convex dev` vraagt de eerste keer om in te loggen en een project te kiezen of aan te maken.
Het schrijft `CONVEX_DEPLOYMENT` en `VITE_CONVEX_URL` naar `.env.local`.

Zonder Convex-account kan het ook lokaal:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev
```

## Host-PIN instellen

De hostschermen en `/admin` zijn beveiligd met één PIN (4 tot 6 cijfers), die server-side wordt
gecontroleerd:

```bash
npx convex env set HOST_PIN 123456
```

## Seed-data laden

```bash
npx convex run seed:seed
```

Dit maakt de quiz "ISO 27001 Training" aan (score uit). Het script is idempotent op titel: nog een
keer draaien doet niets. De seed logt waarschuwingen voor vragen met een `_todo` of zonder goed antwoord.

> **Let op:** vraag 7 ("Toegestane software") heeft nog geen goed antwoord. Een sessie kan pas starten
> als elke niet-poll-vraag een goed antwoord heeft. Vul het in via `/admin`. Controleer daar ook
> vraag 6 (nu alleen B goed).

## Starten

```bash
npm run dev
```

Dit start `convex dev` en de webapp op <http://localhost:3000>.

| Route               | Voor wie                                                         |
| ------------------- | ---------------------------------------------------------------- |
| `/`                 | Spelers: code, naam en e-mail invullen                           |
| `/join/<code>`      | Spelers via de QR-code; de code staat al ingevuld                |
| `/play/<sessionId>` | Spelers tijdens het spel                                         |
| `/host`             | Host: PIN, quiz kiezen, lobby openen                             |
| `/host/<sessionId>` | Beamer (1920×1080, schaalt mee met elk scherm)                   |
| `/admin`            | Beheer: quizzen, vragen, instellingen, resultaten en CSV-exports |

## Een sessie draaien

1. Open `/host` op de laptop aan de beamer en voer de PIN in.
2. Kies een quiz en klik **Open de lobby**. De joincode, de URL en een QR-code verschijnen.
3. Spelers scannen de QR-code of gaan naar de URL en vullen de code in. Hun namen verschijnen live.
4. Klik **Start de quiz**. Bij elke vraag:
   - **Resultaat:** verschijnt automatisch als de tijd op is of iedereen heeft geantwoord.
     Met **Timer overslaan** ga je er direct heen.
   - **Volgende:** gaat naar de volgende vraag. Met score aan komt eerst de tussenstand.
   - **Vorige:** gaat terug naar het vorige resultaat.
   - **Sessie beëindigen:** stopt direct.
5. In de bedieningsbalk schakel je met het maan- of zon-icoon tussen licht en donker. De keuze wordt per apparaat onthouden.

Spelers die hun telefoon verversen of hun wifi kwijtraken, komen vanzelf terug in dezelfde sessie
(hun speler-ID staat in `localStorage`). Aanmelden met hetzelfde e-mailadres in dezelfde sessie geeft
dezelfde speler terug.

## Score aan- of uitzetten

Ga naar `/admin`, kies **Vragen bewerken** bij de quiz en zet in **Quizinstellingen** de schakelaar
**Score en tussenstand** aan of uit. Klik daarna **Instellingen opslaan**. De instelling geldt voor
nieuwe sessies: een sessie legt de instelling vast op het moment dat de lobby opent.

Met score aan geldt:

- Een goed antwoord levert 500 punten plus maximaal 500 snelheidsbonus op, lineair over de tijdslimiet.
- Bij meerkeuze moet de set exact kloppen.
- Een poll geeft geen punten.

## Exports

Per sessie (`/admin` → **Bekijk resultaten en exporteer CSV**):

- **Deelname (CSV):**
  - Kolommen: sessiedatum, quiz, naam, e-mail, aantal beantwoorde vragen, en per vraag
    goed / fout / niet beantwoord.
  - Een kolom `score` alleen als de sessie met score speelde.
  - Voor de ISO 27001-training is dit het trainingsrecord voor de auditor.
- **Verdeling (CSV):** per vraag en per optie de tekst, of die goed is en hoeveel spelers die kozen,
  plus het aantal spelers zonder antwoord.

## Ontwerp

`design/` bevat een referentie-snapshot van het ontwerp:

- de artboards als `.dc.html`-bron;
- de componenteninventaris;
- de ROX `tokens.json`.

De bron van waarheid blijft het canvas; zie `design/README.md` voor de link, de koppeling tussen
ontwerp en code, en de bewuste afwijkingen. Na een wijziging in de ROX-tokens:

```bash
npm run tokens
```

## Projectstructuur

```
design/            snapshot van het ontwerp (zie design/README.md)
scripts/           generate-tokens.mjs
convex/
  schema.ts        tabellen en indexes
  sessions.ts      PIN, sessie aanmaken, joinen, speler- en hostweergave (gesanitized)
  game.ts          fase-overgangen en de geplande automatische reveal
  answers.ts       antwoord indienen en beoordelen (alleen hier, op servertijd)
  admin.ts         quizzen, vragen, instellingen, resultaten
  seed.ts          ISO 27001-seed
  lib/             auth, scoring, data-helpers, flow, joincodes, limieten
src/
  styles/tokens.css   ROX-tokens (gegenereerd uit het design system)
  styles/app.css      Tailwind-thema, beamerschaal, licht/donker voor de host
  components/         één component per item uit de componenteninventaris
  features/           schermen per oppervlak (player, host, admin)
  routes/             bestandsgebaseerde routes
```

### Veiligheidsregels in de backend

- **Vóór de reveal:** goede antwoorden, de toelichting en de verdeling gaan pas naar een client vanaf
  de fase `reveal`. Dat geldt ook voor de beamer. Tijdens een vraag gaat alleen "X / N beantwoord" mee.
- **Antwoorden beoordelen:** alleen `submitAnswer` doet dat, op servertijd. Te late antwoorden,
  tweede antwoorden en antwoorden in de verkeerde fase worden geweigerd.
- **Score en positie:** zonder score leveren de queries deze velden niet (`null`), niet `0`.
