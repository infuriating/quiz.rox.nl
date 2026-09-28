import { createFileRoute } from '@tanstack/react-router'
import { JoinScreen } from '~/features/player/JoinScreen'

export const Route = createFileRoute('/')({
  ssr: false,
  component: () => <JoinScreen />,
})
