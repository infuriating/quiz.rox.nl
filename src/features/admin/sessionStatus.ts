type Status = {
  phase: string
  endReason: 'completed' | 'ended' | 'expired' | null
}

/** Dutch status label for a session row. */
export function sessionStatus({ phase, endReason }: Status): string {
  if (phase !== 'finished') return 'Bezig'
  if (endReason === 'expired') return 'Verlopen'
  if (endReason === 'ended') return 'Beëindigd'
  return 'Afgerond'
}
