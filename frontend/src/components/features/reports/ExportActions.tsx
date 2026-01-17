"use client"

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

import { Button } from '@/components/ui/FormComponents'

interface ExportActionsProps {
  onExportCSV: () => void
  onExportPDF: () => void
  disabled?: boolean
}

export function ExportActions({ onExportCSV, onExportPDF, disabled }: ExportActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="primary"
        onClick={onExportCSV}
        disabled={disabled}
        className="inline-flex items-center gap-2"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Export CSV
      </Button>
      <Button
        variant="secondary"
        onClick={onExportPDF}
        disabled={disabled}
        className="inline-flex items-center gap-2"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  )
}
