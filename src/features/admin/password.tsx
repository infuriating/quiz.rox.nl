import { createContext, useContext } from 'react'

export const AdminPasswordContext = createContext<string | null>(null)

export function useAdminPassword(): string {
  const password = useContext(AdminPasswordContext)
  if (!password) throw new Error('useAdminPassword outside the admin layout')
  return password
}
