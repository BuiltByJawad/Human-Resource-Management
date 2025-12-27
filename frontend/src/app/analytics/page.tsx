import { cookies } from 'next/headers'
import { analyticsService } from '@/services/analyticsService'
import { AnalyticsDashboardClient } from './AnalyticsDashboardClient'

function buildApiBase() {
    return (
        process.env.BACKEND_URL ||
        (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
        'http://localhost:5000'
    );
}

async function fetchWithToken(path: string, token: string | null) {
    if (!token) return null;
    try {
        const base = buildApiBase();
        const response = await fetch(`${base}${path}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            cache: 'no-store'
        });
        if (!response.ok) return null;
        const payload = await response.json().catch(() => null);
        return payload?.data ?? payload;
    } catch {
        return null;
    }
}

export default async function AnalyticsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value ?? null;

    // Default period for initial fetch is 30 days
    const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
    const endDate = new Date().toISOString();

    const [metrics, deptStats] = await Promise.all([
        fetchWithToken(`/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`, token),
        fetchWithToken('/api/analytics/departments', token)
    ]);

    return (
        <AnalyticsDashboardClient
            initialMetrics={metrics}
            initialDeptStats={deptStats || []}
        />
    );
}
