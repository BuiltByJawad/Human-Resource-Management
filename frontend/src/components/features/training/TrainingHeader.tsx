"use client"

import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface TrainingHeaderProps {
  title: string
  subtitle: string
}

export function TrainingHeader({ title, subtitle }: TrainingHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
