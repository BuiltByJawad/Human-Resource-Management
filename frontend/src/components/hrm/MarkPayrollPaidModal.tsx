'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { DatePicker, Input } from '@/components/ui/FormComponents'

type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'mobile_money' | 'other'

export type MarkPayrollPaidPayload = {
  paidAt: string
  paymentMethod: PaymentMethod
  paymentReference?: string
}

type MarkPayrollPaidModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: MarkPayrollPaidPayload) => Promise<void>
}

const schema = yup.object({
  paidAt: yup.string().required('Paid date is required'),
  paymentMethod: yup
    .mixed<PaymentMethod>()
    .oneOf(['bank_transfer', 'cash', 'cheque', 'mobile_money', 'other'])
    .required('Payment method is required'),
  paymentReference: yup.string().optional(),
})

type FormData = yup.InferType<typeof schema>

export default function MarkPayrollPaidModal({ isOpen, onClose, onConfirm }: MarkPayrollPaidModalProps) {
  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      paidAt: new Date().toISOString().slice(0, 10),
      paymentMethod: 'bank_transfer',
      paymentReference: '',
    },
  })

  const submit = async (data: FormData) => {
    setSaving(true)
    try {
      const paidAtIso = new Date(`${data.paidAt}T00:00:00.000Z`).toISOString()
      await onConfirm({
        paidAt: paidAtIso,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference?.trim() ? data.paymentReference.trim() : undefined,
      })
      onClose()
      reset()
    } finally {
      setSaving(false)
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
                    disabled={saving}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-50 sm:mx-0 sm:h-14 sm:w-14">
                    <CheckCircleIcon className="h-7 w-7 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                      Confirm Payment
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Record payment details. This will set the payroll status to Paid.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-5">
                      <div>
                        <Controller
                          name="paidAt"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              label="Paid Date"
                              value={field.value}
                              onChange={(date) => {
                                if (!date) {
                                  field.onChange('')
                                  return
                                }
                                field.onChange(date.toISOString().slice(0, 10))
                              }}
                              required
                              error={errors.paidAt?.message}
                              mode="date"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <Controller
                          name="paymentMethod"
                          control={control}
                          render={({ field }) => (
                            <select
                              value={field.value}
                              onChange={(e) => {
                                const v = e.target.value as PaymentMethod
                                field.onChange(v)
                              }}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={saving}
                            >
                              <option value="bank_transfer">Bank transfer</option>
                              <option value="cash">Cash</option>
                              <option value="cheque">Cheque</option>
                              <option value="mobile_money">Mobile money</option>
                              <option value="other">Other</option>
                            </select>
                          )}
                        />
                        {errors.paymentMethod?.message ? (
                          <p className="mt-1 text-sm text-red-600">{String(errors.paymentMethod.message)}</p>
                        ) : null}
                      </div>

                      <div>
                        <Controller
                          name="paymentReference"
                          control={control}
                          render={({ field }) => (
                            <Input
                              label="Payment Reference (optional)"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Bank txn id / voucher no."
                              disabled={saving}
                            />
                          )}
                        />
                      </div>

                      <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex w-full justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {saving ? 'Saving...' : 'Mark as Paid'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all"
                          onClick={onClose}
                          disabled={saving}
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
