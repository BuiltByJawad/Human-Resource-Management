"use client"

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { PayrollRecord } from '@/app/payroll/types'
import { usePayslip } from '@/hooks/usePayslip'
import { PayslipHeader } from './PayslipHeader'
import { PayslipEmployeeDetails } from './PayslipEmployeeDetails'
import { PayslipBreakdown } from './PayslipBreakdown'
import { PayslipNetPay } from './PayslipNetPay'
import { PayslipFooter } from './PayslipFooter'

interface PayslipModalProps {
  isOpen: boolean
  onClose: () => void
  payroll: PayrollRecord | null
}

export function PayslipModal({ isOpen, onClose, payroll }: PayslipModalProps) {
  const { payslipRef, handlePrint, handleDownloadPdf, handleDownloadCsv } = usePayslip({
    payrollId: payroll?.id ?? null,
    employeeId: payroll?.employee?.id ?? null,
  })

  if (!payroll) return null

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <style>
                  {`
                    @media print {
                      body * {
                        visibility: hidden;
                      }
                      #payslip-content, #payslip-content * {
                        visibility: visible;
                      }
                      #payslip-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                      }
                      .no-print {
                        display: none !important;
                      }
                    }
                  `}
                </style>

                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block no-print">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div ref={payslipRef} id="payslip-content" className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <PayslipHeader payPeriod={payroll.payPeriod} />
                  <PayslipEmployeeDetails payroll={payroll} />
                  <PayslipBreakdown payroll={payroll} />
                  <PayslipNetPay payroll={payroll} />
                </div>

                <PayslipFooter
                  onDownloadPdf={handleDownloadPdf}
                  onDownloadCsv={handleDownloadCsv}
                  onPrint={handlePrint}
                  onClose={onClose}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
