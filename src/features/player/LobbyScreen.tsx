import { Badge } from '~/components/Badge'
import { Icon } from '~/components/Icon'
import type { PlayerView } from './types'
import { PhoneFrame, WaitingDots } from './PhoneFrame'

export function LobbyScreen({
  view,
  banner,
}: {
  view: PlayerView
  banner: React.ReactNode
}) {
  const initial = view.player.name.charAt(0).toUpperCase()
  return (
    <PhoneFrame banner={banner} right={<Badge tone="neutral">Lobby</Badge>}>
      <div className="flex flex-1 flex-col items-center px-6 pt-10 pb-8 text-center">
        <div className="flex flex-1 flex-col items-center justify-center gap-11">
          <div
            aria-hidden="true"
            className="relative flex size-[168px] items-center justify-center"
          >
            {[0, 0.8, 1.6].map((d) => (
              <span
                key={d}
                className="absolute size-24 animate-ring rounded-full border-2 border-blue-300"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
            <span className="relative flex size-[88px] items-center justify-center rounded-full bg-blue font-display text-[36px] font-bold text-white">
              {initial}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="m-0 font-display text-[36px] leading-[1.1] font-bold tracking-display">
              Je doet mee, {view.player.name}
            </h1>
            <p className="m-0 text-[17px] leading-[1.5] text-ink-70">
              Kijk naar het scherm voorin. De host start zo de eerste vraag.
            </p>
          </div>
          <div
            role="status"
            className="inline-flex items-center gap-2.5 rounded-pill bg-ink-10 px-5 py-3"
          >
            <Icon name="users" size={18} className="text-ink-70" />
            <span className="font-display text-[17px] font-semibold">
              {view.session.playerCount}{' '}
              {view.session.playerCount === 1 ? 'speler' : 'spelers'}
            </span>
            <span className="text-[15px] text-ink-55">in de lobby</span>
          </div>
        </div>
        <WaitingDots label="Wachten op de host" />
      </div>
    </PhoneFrame>
  )
}
