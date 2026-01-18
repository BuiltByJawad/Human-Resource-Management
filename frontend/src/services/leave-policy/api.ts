import api from '@/lib/axios'
import type { LeavePolicyPayload } from '@/services/leave-policy/types'

export const updateLeavePolicy = async (payload: LeavePolicyPayload): Promise<boolean> => {
  const response = await api.put<{ success?: boolean }>('/org/leave-policy', payload)
  return Boolean(response.data?.success)
}
