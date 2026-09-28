import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdminPasswordContext } from '~/features/admin/password'
import { PasswordScreen } from '~/features/host/PasswordScreen'
import { passwordStore } from '~/lib/storage'

export const Route = createFileRoute('/admin')({
  ssr: false,
  component: AdminLayout,
})

function AdminLayout() {
  const [password, setPassword] = useState<string | null>(() =>
    passwordStore.get(),
  )
  if (!password) {
    return (
      <PasswordScreen
        compact
        onOk={(p) => {
          passwordStore.set(p)
          setPassword(p)
        }}
      />
    )
  }
  return (
    <AdminPasswordContext.Provider value={password}>
      <div className="min-h-dvh bg-ink-05">
        <header className="flex h-16 items-center gap-12 border-b border-ink-15 bg-white px-10">
          <span className="font-display text-lg font-bold tracking-heading">
            ROX Live Quiz
          </span>
          <nav aria-label="Beheer" className="flex flex-1 gap-7">
            <Link
              to="/admin"
              activeOptions={{ exact: false }}
              className="box-border flex h-16 items-center border-b-2 border-blue text-[15px] font-semibold text-ink no-underline"
            >
              Quizzen
            </Link>
          </nav>
          <Link
            to="/host"
            className="text-sm text-ink-70 no-underline hover:text-ink"
          >
            Naar de host
          </Link>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent text-sm text-ink-70 hover:text-ink"
            onClick={() => {
              passwordStore.clear()
              setPassword(null)
            }}
          >
            Uitloggen
          </button>
        </header>
        <Outlet />
      </div>
    </AdminPasswordContext.Provider>
  )
}
