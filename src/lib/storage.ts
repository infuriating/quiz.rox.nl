// Small wrappers so a blocked or private-mode storage never breaks the app.
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const playerStore = {
  get: (sessionId: string) =>
    safe(() => localStorage.getItem(`rq:player:${sessionId}`), null),
  set: (sessionId: string, playerId: string) =>
    safe(
      () => localStorage.setItem(`rq:player:${sessionId}`, playerId),
      undefined,
    ),
  clear: (sessionId: string) =>
    safe(() => localStorage.removeItem(`rq:player:${sessionId}`), undefined),
}

export const hostStore = {
  get: (sessionId: string) =>
    safe(() => localStorage.getItem(`rq:host:${sessionId}`), null),
  set: (sessionId: string, token: string) =>
    safe(() => localStorage.setItem(`rq:host:${sessionId}`, token), undefined),
}

export const pinStore = {
  get: () => safe(() => sessionStorage.getItem('rq:pin'), null),
  set: (pin: string) =>
    safe(() => sessionStorage.setItem('rq:pin', pin), undefined),
  clear: () => safe(() => sessionStorage.removeItem('rq:pin'), undefined),
}

export const themeStore = {
  get: (): 'light' | 'dark' =>
    safe(() => localStorage.getItem('rq:host-theme'), null) === 'dark'
      ? 'dark'
      : 'light',
  set: (t: 'light' | 'dark') =>
    safe(() => localStorage.setItem('rq:host-theme', t), undefined),
}
