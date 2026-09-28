import { createContext, useContext } from 'react'

export const AdminPinContext = createContext<string | null>(null)

export function useAdminPin(): string {
  const pin = useContext(AdminPinContext)
  if (!pin) throw new Error('useAdminPin outside the admin layout')
  return pin
}
