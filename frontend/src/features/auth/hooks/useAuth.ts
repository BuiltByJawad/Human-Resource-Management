'use client'

import { useAuthStore, type AuthState } from '@/store/useAuthStore'

type Selector<T> = (state: AuthState) => T

export function useAuth(): AuthState
export function useAuth<T>(selector: Selector<T>): T
export function useAuth<T>(selector?: Selector<T>): AuthState | T {
  return selector ? useAuthStore(selector) : useAuthStore()
}

export type { AuthState }
