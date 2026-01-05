import { LeaveRequestsPageClient } from './LeaveRequestsPageClient'
import { cookies } from 'next/headers'
import { fetchLeaveRequests } from '@/features/leave'

export default async function LeaveRequestsPage() {
	const cookieStore = await cookies()
	const token = cookieStore.get('accessToken')?.value ?? null
	const initialRequests = await fetchLeaveRequests({ status: 'pending' }, token ?? undefined)
	return (
		<LeaveRequestsPageClient
			initialRequests={initialRequests}
			initialHasToken={!!token}
		/>
	)
}
