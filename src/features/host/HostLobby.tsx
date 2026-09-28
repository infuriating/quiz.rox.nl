import { QRCodeSVG } from 'qrcode.react'
import { JoinCodeDisplay } from '~/components/JoinCodeDisplay'
import { Label } from '~/components/Label'
import { cx } from '~/lib/cx'
import type { HostView } from './types'

export function HostLobby({ view }: { view: HostView }) {
  const s = view.session
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const host = typeof window !== 'undefined' ? window.location.host : ''
  const joinUrl = `${origin}/join/${s.joinCode}`
  const newest = view.players.reduce<string | null>((acc, p, _i, arr) => (p.joinedAt === Math.max(...arr.map((x) => x.joinedAt)) ? p.id : acc), null)
  return (
    <>
      <div className="absolute top-0 bottom-0 left-0 flex w-[1000px] flex-col gap-12 px-20 pt-[88px] pb-[120px]">
        <Label className="text-beamer-label text-host-muted">{s.quizTitle}</Label>
        <h1 className="m-0 font-display text-beamer-title leading-[1.02] font-bold tracking-hero text-host-text">Doe mee op je telefoon</h1>
        <div className="flex flex-col gap-5">
          <Label className="text-[20px] text-host-muted">Ga naar</Label>
          <span className="font-display text-[64px] leading-none font-bold tracking-display text-host-accent">{host}</span>
        </div>
        <div className="flex flex-col gap-5">
          <Label className="text-[20px] text-host-muted">En vul deze code in</Label>
          <JoinCodeDisplay code={s.joinCode} />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-8">
          <div className="flex size-[264px] shrink-0 items-center justify-center rounded-[20px] bg-white p-5">
            <QRCodeSVG value={joinUrl} size={224} level="M" bgColor="#ffffff" fgColor="#0d1220" title={`QR-code naar ${joinUrl}`} />
          </div>
          <p className="m-0 max-w-[420px] text-beamer-body leading-[1.4] text-host-soft">Of scan de code met je camera. Je naam verschijnt direct rechts in beeld.</p>
        </div>
      </div>
      <section aria-label="Spelers" className="absolute top-0 right-0 bottom-0 flex w-[920px] flex-col gap-10 border-l border-host-hair bg-host-sunk pt-[88px] pr-20 pb-[120px] pl-[72px]">
        <div className="flex items-baseline justify-between">
          <span className="flex items-baseline gap-5">
            <span className="tabular font-display text-beamer-count leading-[.9] font-bold tracking-hero text-host-text">{s.playerCount}</span>
            <span className="font-display text-[36px] font-semibold text-host-text">{s.playerCount === 1 ? 'speler' : 'spelers'}</span>
          </span>
          {s.maxPlayers !== null && <Label className="text-[20px] text-host-muted">van {s.maxPlayers}</Label>}
        </div>
        <div className="grid grid-cols-3 gap-4 overflow-hidden">
          {view.players.map((p) => (
            <span
              key={p.id}
              className={cx(
                'flex h-20 animate-pop items-center justify-center truncate rounded-pill px-4 font-display text-[32px] font-semibold',
                p.id === newest ? 'bg-blue text-white' : 'bg-host-chip text-host-text',
              )}
            >
              {p.name}
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <p className="m-0 flex items-center gap-2.5 text-beamer-label text-host-muted">
          {s.playerCount === 0 ? 'Wachten op de eerste speler' : 'Wachten op de rest'}
          {[0, 0.2, 0.4].map((d) => (
            <span key={d} className="size-[7px] animate-dot rounded-full bg-host-muted" style={{ animationDelay: `${d}s` }} />
          ))}
        </p>
      </section>
    </>
  )
}
