'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  FlagIcon,
  ArrowRightIcon,
  HeartIcon,
  CreditCardIcon,
  ArrowTrendingDownIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import type { PortalModule, PortalModuleIcon } from './modules'

const ICON_MAP: Record<PortalModuleIcon, typeof CalendarDaysIcon> = {
  shifts: CalendarDaysIcon,
  documents: DocumentTextIcon,
  training: AcademicCapIcon,
  goals: FlagIcon,
  benefits: HeartIcon,
  expenses: CreditCardIcon,
  offboarding: ArrowTrendingDownIcon,
  leave: ClipboardDocumentListIcon
}

interface PortalDashboardClientProps {
  modules: PortalModule[]
}

export function PortalDashboardClient({ modules }: PortalDashboardClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Employee Portal</h1>
          <p className="text-gray-600">Welcome back! Select a module to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => {
            const Icon = ICON_MAP[module.icon]

            return (
              <Link key={module.title} href={module.href} className="group">
                <Card className="h-full hover:shadow-lg transition-all hover:border-blue-200 bg-white">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${module.color}`}>
                      <Icon className={`w-6 h-6 ${module.iconColor}`} />
                    </div>
                    <CardTitle className="group-hover:text-blue-600 transition-colors text-lg">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end pt-0">
                    <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
