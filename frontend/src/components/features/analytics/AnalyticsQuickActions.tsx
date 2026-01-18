"use client"

import { useRouter } from 'next/navigation'
import { ArrowRightIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/FormComponents'

export function AnalyticsQuickActions() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-gradient-to-br from-red-500 to-orange-600 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Burnout Risk</CardTitle>
          <CardDescription className="text-white/80">AI-driven wellbeing analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-6">
            Identify team members at risk of burnout based on work patterns and engagement.
          </p>
          <Button
            onClick={() => router.push('/analytics/burnout')}
            className="w-full bg-white/20 hover:bg-white/30 border-none text-white font-semibold flex items-center justify-center gap-2"
          >
            View Burnout Report
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm h-[calc(100%-190px)]">
        <CardHeader>
          <CardTitle className="text-lg">Growth Insights</CardTitle>
          <CardDescription>Hiring trends and projections</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-8">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
            <ArrowTrendingDownIcon className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 text-center px-4">
            Historical growth trends will appear here as the system gathers more data over time.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
