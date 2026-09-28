import { ConvexError } from 'convex/values'

export function errorCode(e: unknown): string | null {
  if (
    e instanceof ConvexError &&
    e.data &&
    typeof e.data === 'object' &&
    'code' in e.data
  ) {
    return String((e.data as { code: unknown }).code)
  }
  return null
}

/** Dutch, second person, an instruction rather than a verdict. */
export function errorMessage(e: unknown): string {
  const code = errorCode(e)
  const data =
    e instanceof ConvexError ? (e.data as Record<string, unknown>) : {}
  switch (code) {
    case 'INVALID_CODE':
      return 'Deze code hoort niet bij een actieve quiz. Neem de code over van het scherm.'
    case 'SESSION_FULL':
      return 'Deze quiz zit vol. Vraag de host of er nog plek is.'
    case 'NAME_REQUIRED':
      return 'Vul je naam in.'
    case 'INVALID_EMAIL':
      return 'Vul een geldig e-mailadres in.'
    case 'INVALID_PIN':
      return 'Deze PIN klopt niet. Probeer het opnieuw.'
    case 'PIN_NOT_CONFIGURED':
      return 'Er is nog geen host-PIN ingesteld. Zet HOST_PIN in Convex (zie README).'
    case 'MISSING_CORRECT': {
      const qs = Array.isArray(data.questions)
        ? (data.questions as Array<number>).join(', ')
        : ''
      return `Vraag ${qs} heeft nog geen goed antwoord. Vul dit in bij het beheer voordat je start.`
    }
    case 'NO_QUESTIONS':
      return 'Deze quiz heeft nog geen vragen. Voeg eerst vragen toe.'
    case 'INVALID_MAX_PLAYERS':
      return `Vul een aantal tussen 1 en ${typeof data.max === 'number' ? data.max : 500} in, of laat het veld leeg.`
    case 'INVALID_IDLE_TIMEOUT':
      return 'Kies een verlooptijd van maximaal 4 uur.'
    case 'QUIZ_INACTIVE':
      return 'Deze quiz staat op inactief. Activeer hem in het beheer om een sessie te starten.'
    case 'QUIZ_HAS_ACTIVE_SESSION':
      return 'Deze quiz heeft een sessie die nog bezig is. Beëindig die sessie eerst.'
    case 'OUTRO_TOO_LONG':
      return 'Maak de afsluitende boodschap korter dan 120 tekens.'
    case 'INVALID_QUESTION_TEXT':
      return 'Vul een vraag in van maximaal 200 tekens.'
    case 'INVALID_OPTION_COUNT':
      return 'Geef twee tot vier antwoordopties.'
    case 'INVALID_OPTION_TEXT':
      return 'Vul elke optie in, met maximaal 140 tekens.'
    case 'SINGLE_HAS_MULTIPLE_CORRECT':
      return 'Kies bij één antwoord precies één goede optie, of zet het type op meerdere antwoorden.'
    case 'INVALID_TIME_LIMIT':
      return 'Kies een tijdslimiet tussen 5 en 300 seconden.'
    case 'TITLE_REQUIRED':
      return 'Geef de quiz een titel.'
    default:
      return 'Er ging iets mis. Probeer het opnieuw.'
  }
}
