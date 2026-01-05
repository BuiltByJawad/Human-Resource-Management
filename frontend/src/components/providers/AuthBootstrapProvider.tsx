'use client'

import { createContext, useContext, useEffect } from 'react'

import type { CurrentUser } from '@/features/auth/types/auth.types'
import { useAuth } from '@/features/auth'

export interface InitialAuthValue {
  user: CurrentUser | null
  token: string | null
}

const AuthBootstrapContext = createContext<InitialAuthValue | null>(null)

interface AuthBootstrapProviderProps {
  auth: InitialAuthValue
  children: React.ReactNode
}

export function AuthBootstrapProvider({ auth, children }: AuthBootstrapProviderProps) {
  const bootstrapFromServer = useAuth((state) => state.bootstrapFromServer)

  useEffect(() => {
    // Seed the client auth store from the server-fetched user/token
    bootstrapFromServer({ user: auth.user, token: auth.token })
  }, [auth.user, auth.token, bootstrapFromServer])

  return (
    <AuthBootstrapContext.Provider value={auth}>
      {children}
    </AuthBootstrapContext.Provider>
  )
}

export function useInitialAuth(): InitialAuthValue | null {
  return useContext(AuthBootstrapContext)
}
