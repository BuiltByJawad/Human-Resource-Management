'use client'

import { useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { downloadPayslipPdf, downloadPayslipsCsv } from '@/services/payroll/api'

export interface UsePayslipOptions {
  payrollId?: string | null
  employeeId?: string | null
}

export function usePayslip({ payrollId, employeeId }: UsePayslipOptions) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const payslipRef = useRef<HTMLDivElement | null>(null)

  const handlePrint = () => {
    const node = payslipRef.current
    if (!node) return

    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument
    const win = iframe.contentWindow
    if (!doc || !win) {
      document.body.removeChild(iframe)
      return
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n')

    doc.open()
    doc.write(`<!doctype html><html><head><meta charset="utf-8" />${styles}</head><body>${node.outerHTML}</body></html>`)
    doc.close()

    const cleanup = () => {
      try {
        document.body.removeChild(iframe)
      } catch {
        // ignore
      }
    }

    const triggerPrint = () => {
      try {
        win.focus()
        win.print()
      } finally {
        window.setTimeout(cleanup, 500)
      }
    }

    window.setTimeout(triggerPrint, 250)
  }

  const handleDownloadPdf = async () => {
    if (!payrollId) return
    try {
      await downloadPayslipPdf(String(payrollId), token ?? undefined)
      showToast('Payslip downloaded', 'success')
    } catch (error: unknown) {
      handleCrudError({ error, resourceLabel: 'Payslip PDF export', showToast })
    }
  }

  const handleDownloadCsv = async () => {
    try {
      await downloadPayslipsCsv(employeeId ? String(employeeId) : undefined, token ?? undefined)
      showToast('Payslips exported', 'success')
    } catch (error: unknown) {
      handleCrudError({ error, resourceLabel: 'Payslips CSV export', showToast })
    }
  }

  return {
    payslipRef,
    handlePrint,
    handleDownloadPdf,
    handleDownloadCsv,
  }
}
