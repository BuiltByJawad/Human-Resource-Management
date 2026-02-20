'use client'

import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LazyDatePicker } from '../ui/LazyDatePicker'
import { format } from 'date-fns'

interface ExportPayrollModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (payPeriod: string) => Promise<void>
}

const exportSchema = yup.object({
  payPeriod: yup
    .string()
    .required('Pay period is required')
    .matches(/^\d{4}-\d{2}$/, 'Use YYYY-MM format'),
})

type ExportFormData = yup.InferType<typeof exportSchema>

export default function ExportPayrollModal({ isOpen, onClose, onExport }: ExportPayrollModalProps) {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExportFormData>({
    resolver: yupResolver(exportSchema),
    defaultValues: {
      payPeriod: new Date().toISOString().slice(0, 7),
    },
  })

  const onSubmit = async (data: ExportFormData) => {
    setLoading(true)
    try {
      await onExport(data.payPeriod)
      onClose()
      reset()
    } finally {
      setLoading(false)
    }
  }

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
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 max-h-[90vh] overflow-y-auto">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                    disabled={loading}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-900/10 sm:mx-0 sm:h-14 sm:w-14">
                    <ArrowDownTrayIcon className="h-7 w-7 text-gray-900" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                      Export Payroll CSV
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Download payroll records for a specific month.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
                      <div>
                        <Controller
                          name="payPeriod"
                          control={control}
                          render={({ field }) => (
                            <LazyDatePicker
                              label="Pay Period"
                              value={field.value}
                              onChange={(date) => {
                                if (!date) {
                                  field.onChange('')
                                  return
                                }
                                field.onChange(format(date, 'yyyy-MM'))
                              }}
                              required
                              error={errors.payPeriod?.message}
                              mode="month"
                            />
                          )}
                        />
                        <p className="mt-2 text-xs text-gray-500">Select the month you want to export.</p>
                      </div>

                      <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {loading ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <ArrowDownTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                              Export CSV
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all"
                          onClick={onClose}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
