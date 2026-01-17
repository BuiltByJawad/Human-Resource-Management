import { ArrowDownTrayIcon, DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline'

interface PayslipFooterProps {
  onDownloadPdf: () => void
  onDownloadCsv: () => void
  onPrint: () => void
  onClose: () => void
}

export function PayslipFooter({ onDownloadPdf, onDownloadCsv, onPrint, onClose }: PayslipFooterProps) {
  return (
    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 no-print">
      <button
        type="button"
        className="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto"
        onClick={onDownloadPdf}
      >
        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
        Download PDF
      </button>
      <button
        type="button"
        className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:w-auto"
        onClick={onDownloadCsv}
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
        Export CSV
      </button>
      <button
        type="button"
        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
        onClick={onPrint}
      >
        <PrinterIcon className="h-5 w-5 mr-2" />
        Print Payslip
      </button>
      <button
        type="button"
        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  )
}
