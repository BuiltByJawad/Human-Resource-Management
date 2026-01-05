import { cookies } from 'next/headers'

import { fetchCurrentUser } from '@/features/auth/services/auth.api'
import type { CurrentUser } from '@/features/auth/types/auth.types'

export interface ServerAuthContext {
  user: CurrentUser | null
  token: string | null
}

export async function getServerAuthContext(): Promise<ServerAuthContext> {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  if (!token) {
    return { user: null, token: null }
  }

  try {
    const user = await fetchCurrentUser(token)
    return { user, token }
  } catch {
    // If the user fetch fails, we still return the token so
    // client-side auth can attempt a refresh.
    return { user: null, token }
  }
}
