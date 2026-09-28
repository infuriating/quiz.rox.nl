import type { FunctionReturnType } from 'convex/server'
import type { api } from '../../../convex/_generated/api'
import { downloadCsv, toCsv } from '~/lib/csv'

type Results = NonNullable<FunctionReturnType<typeof api.admin.sessionResults>>

const LETTERS = 'ABCD'

function stamp(ms: number) {
  return new Date(ms).toISOString().slice(0, 10)
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Participation record per player (e.g. the awareness-training record for an auditor). */
export function exportParticipation(r: Results) {
  const scored = r.session.scoringEnabled
  const header = [
    'sessiedatum',
    'quiz',
    'naam',
    'email',
    'vragen beantwoord',
    ...r.questions.map((q) => `vraag ${q.order}: ${q.topic}`),
  ]
  if (scored) header.push('score')
  const rows = r.players.map((p) => {
    const per = r.questions.map((q) => {
      const a = q.answers.find((x) => x.playerId === p.id)
      if (!a) return 'niet beantwoord'
      if (q.type === 'poll') return 'beantwoord'
      return a.correct ? 'goed' : 'fout'
    })
    const answered = per.filter((x) => x !== 'niet beantwoord').length
    const row: Array<string | number> = [
      stamp(r.session.createdAt),
      r.quizTitle,
      p.name,
      p.email,
      answered,
      ...per,
    ]
    if (scored) row.push(p.score ?? 0)
    return row
  })
  downloadCsv(
    `deelname-${slug(r.quizTitle)}-${stamp(r.session.createdAt)}.csv`,
    toCsv([header, ...rows]),
  )
}

/** How many players picked each option, per question, plus how many did not answer. */
export function exportDistribution(r: Results) {
  const header = [
    'vraag',
    'onderwerp',
    'vraagtekst',
    'optie',
    'optietekst',
    'goed',
    'aantal',
  ]
  const rows: Array<Array<string | number>> = []
  for (const q of r.questions) {
    q.options.forEach((o, i) => {
      rows.push([
        q.order,
        q.topic,
        q.text,
        LETTERS[i],
        o.text,
        o.correct === null ? '' : o.correct ? 'ja' : 'nee',
        o.count,
      ])
    })
    rows.push([
      q.order,
      q.topic,
      q.text,
      '',
      'geen antwoord',
      '',
      q.noAnswerCount,
    ])
  }
  downloadCsv(
    `verdeling-${slug(r.quizTitle)}-${stamp(r.session.createdAt)}.csv`,
    toCsv([header, ...rows]),
  )
}
