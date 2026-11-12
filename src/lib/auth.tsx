import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Role, SessionUser } from './types'
import { api } from './api'

const STORAGE_KEY = 'dws.admin.session'

const DEMO_SESSIONS: Record<Role, SessionUser> = {
  Administrador: {
    id: 'usr_01',
    name: 'Ana Ribeiro',
    email: 'ana.ribeiro@exemplo.pt',
    role: 'Administrador',
  },
  Utilizador: {
    id: 'usr_03',
    name: 'Inês Costa',
    email: 'ines.costa@exemplo.pt',
    role: 'Utilizador',
  },
}

interface AuthContextValue {
  session: SessionUser | null
  login: (role: Role) => SessionUser
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (!parsed?.id || !parsed?.role) return null
    return parsed.role === 'Administrador' || parsed.role === 'Utilizador' ? parsed : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(() => readStoredSession())
  api.setActor(session)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login(role) {
        const next = DEMO_SESSIONS[role]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        api.setActor(next)
        setSession(next)
        return next
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY)
        api.setActor(null)
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}

export function useIsAdmin() {
  return useAuth().session?.role === 'Administrador'
}
