import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

type SeedQuestion = {
  order: number
  topic: string
  type: 'single' | 'multi' | 'poll'
  text: string
  options: string[]
  correct: number[]
  explanation?: string
  _todo?: string
}

const ISO_TITLE = 'ISO 27001 Training'

const ISO_QUESTIONS: SeedQuestion[] = [
  {
    order: 1,
    topic: 'De ISO 27001',
    type: 'single',
    text: 'Bij ROX is de ISO 27001 van toepassing op...',
    options: [
      'alleen de Privacy Officer',
      'alleen op mij',
      'op iedereen bij ROX',
      'op niemand bij ROX',
    ],
    correct: [2],
    explanation: 'De ISO is van toepassing op het hele bedrijf.',
  },
  {
    order: 2,
    topic: 'Bestand versturen',
    type: 'single',
    text: 'Een bestand met persoonsgegevens deel je...',
    options: [
      'prima via de mail. We hebben toch Gmail.',
      'via mijn privé mail, want zakelijke mail is onveiliger.',
      'versleuteld via Keeper, met een one-time-share wachtwoord.',
      'gewoon via WeTransfer als Excel export of PDF.',
    ],
    correct: [2],
    explanation:
      'Versleutelen en one-time-links gebruiken zijn goede manieren van beveiligen.',
  },
  {
    order: 3,
    topic: 'Site gehackt',
    type: 'single',
    text: 'Als ik denk dat een site is gehackt, dan meld ik het...',
    options: [
      'bij de AP (Autoriteit Persoonsgegevens)',
      'aan de klant.',
      'aan onze Security Officer',
      'aan niemand. Ik werk gewoon door aan mijn eigen project.',
    ],
    correct: [2],
    explanation:
      'De Security Officer is eindverantwoordelijke. Ook naar bijv. de AP toe.',
  },
  {
    order: 4,
    topic: 'Mogelijk datalek',
    type: 'multi',
    text: 'Bij een mogelijk datalek moet er binnen 72 uur melding worden gedaan bij de AP. Wanneer is er sprake van een mogelijk datalek?',
    options: [
      'Wanneer er database credentials openbaar zijn gemaakt en er niet bewezen kan worden dat niemand deze heeft gezien.',
      'Als iemand per ongeluk een lijst met contactgegevens heeft gedeeld aan meerdere mensen die hier geen toegang toe zouden moeten hebben.',
      'Als de cookie consent niet goed staat ingesteld.',
      'Wanneer een site zonder persoonsgegevens is gehackt.',
    ],
    correct: [0, 1],
  },
  {
    order: 5,
    topic: 'Site opleveren',
    type: 'single',
    text: 'Zodra we een project starten houden we rekening met security. Dit checken we tijdens de go-live. Aan de hand van wat doen we dit?',
    options: [
      'Het ISO 27001 handboek in Base27.',
      'De Project Lead weet dit alleen.',
      'De Security Baseline checklist in Teamwork die we met het team bespreken.',
      'De klant bepaalt dit voor ons.',
    ],
    correct: [2],
  },
  {
    order: 6,
    topic: 'Ontwerpen van een site en beveiliging',
    type: 'multi',
    text: 'Tijdens het ontwerpen van een website houden we rekening met de ISO 27001 door...',
    options: [
      'via Figma te ontwerpen. Dit is een enorm veilige app en staat in de lijst met toegestane software.',
      'Privacy by design toe te passen.',
      'Veilige fonts toe te passen.',
      'Gebruik te maken van rechtenvrije beelden.',
    ],
    correct: [1],
    _todo: 'VERIFY correct set',
  },
  {
    order: 7,
    topic: 'Toegestane software',
    type: 'single',
    text: 'Waar kan ik vinden welk software is toegestaan op mijn laptop',
    options: [
      'Personeelshandboek',
      'Mijn arbeidscontract',
      'Teamwork Projects',
      'Confluence',
    ],
    correct: [],
    _todo: 'FILL IN correct answer',
  },
  {
    order: 8,
    topic: 'Wat kan ik met internet.nl',
    type: 'single',
    text: 'Wat kan ik met internet.nl?',
    options: [
      'Testen of er moderne en betrouwbare Internetstandaarden worden gebruikt door onze hosting en sites/apps.',
      'Mail service testen',
      'Snelheid testen',
      'Geen idee / n.v.t.',
    ],
    correct: [0],
  },
  {
    order: 9,
    topic: 'Uitval hosting',
    type: 'single',
    text: 'Als een hostingdienst volledig uitvalt...',
    options: [
      'hoef ik niks te doen.',
      'laat ik dit via de mail weten aan Patrick.',
      'meld ik dit in het Slack channel van mijn project.',
      'meld ik dit in het calamiteiten Slack channel. Ik wacht op bevestiging. Eventueel meld ik het via Whatsapp of bel ik Eric of Robbert.',
    ],
    correct: [3],
  },
  {
    order: 10,
    topic: 'Verantwoordelijkheid',
    type: 'single',
    text: 'Dat ROX ISO 27001 gecertificeerd is maakt mij qua security verantwoordelijk voor:',
    options: [
      'Alleen mijn eigen laptop en telefoon',
      'Mijn devices, zowel qua up to date houden van de software, als de hardware, als alle projecten waar ik aan werk.',
      'Alle projecten',
      'Alle ROX security',
    ],
    correct: [1],
  },
]

const OPTION_IDS = ['a', 'b', 'c', 'd']

/** Idempotent by quiz title: run with `npx convex run seed:seed`. */
export const seed = internalMutation({
  args: {},
  returns: v.object({ created: v.boolean(), warnings: v.array(v.string()) }),
  handler: async (ctx) => {
    const warnings: string[] = []
    for (const q of ISO_QUESTIONS) {
      if (q._todo) warnings.push(`Vraag ${q.order} (${q.topic}): ${q._todo}`)
      if (q.type !== 'poll' && q.correct.length === 0) {
        warnings.push(
          `Vraag ${q.order} (${q.topic}) heeft geen goed antwoord; een sessie kan pas starten als dit is ingevuld.`,
        )
      }
    }
    for (const w of warnings) console.warn(w)

    const existing = await ctx.db
      .query('quizzes')
      .withIndex('by_title', (q) => q.eq('title', ISO_TITLE))
      .first()
    if (existing) return { created: false, warnings }

    const quizId = await ctx.db.insert('quizzes', {
      title: ISO_TITLE,
      scoringEnabled: false,
      outroMessage:
        'Twijfel je over een incident? Meld het bij de Security Officer.',
    })
    for (const q of ISO_QUESTIONS) {
      await ctx.db.insert('questions', {
        quizId,
        order: q.order,
        topic: q.topic,
        text: q.text,
        type: q.type,
        options: q.options.map((text, i) => ({
          id: OPTION_IDS[i],
          text,
          correct: q.correct.includes(i),
        })),
        explanation: q.explanation,
        timeLimitSec: q.type === 'multi' ? 45 : 30,
      })
    }
    return { created: true, warnings }
  },
})
