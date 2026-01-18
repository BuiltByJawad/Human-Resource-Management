import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button, DatePicker, Input, TextArea } from '@/components/ui/FormComponents'
import type { Resolver } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { MaintenancePayload } from '@/services/assets/types'

interface MaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MaintenancePayload) => Promise<void>
}

const maintenanceSchema = yup.object({
  description: yup.string().required('Description is required'),
  cost: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  date: yup.string().required('Date is required'),
  performedBy: yup.string(),
})

interface MaintenanceFormData {
  description: string
  cost?: number | null
  date: string
  performedBy?: string
}

export const MaintenanceModal = ({ isOpen, onClose, onSubmit }: MaintenanceModalProps) => {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: yupResolver(maintenanceSchema) as Resolver<MaintenanceFormData>,
    defaultValues: {
      description: '',
      cost: null,
      date: new Date().toISOString().split('T')[0],
      performedBy: '',
    },
  })

  useEffect(() => {
    if (!isOpen) {
      reset({
        description: '',
        cost: null,
        date: new Date().toISOString().split('T')[0],
        performedBy: '',
      })
    }
  }, [isOpen, reset])

  const onFormSubmit = async (data: MaintenanceFormData) => {
    setLoading(true)
    try {
      await onSubmit(data)
      onClose()
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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                Log Maintenance
              </Dialog.Title>
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <div>
                  <TextArea
                    label="Description"
                    placeholder="Describe the issue and resolution..."
                    rows={3}
                    required
                    error={errors.description?.message}
                    {...register('description')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Controller
                      control={control}
                      name="date"
                      render={({ field }) => (
                        <DatePicker
                          label="Date"
                          required
                          value={field.value}
                          onChange={(date) =>
                            field.onChange(date ? date.toISOString().split('T')[0] : '')
                          }
                          error={errors.date?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Input
                      label="Cost"
                      type="number"
                      placeholder="0.00"
                      error={errors.cost?.message}
                      {...register('cost')}
                    />
                  </div>
                </div>
                <div>
                  <Input
                    label="Performed By"
                    placeholder="Technician or Vendor Name"
                    error={errors.performedBy?.message}
                    {...register('performedBy')}
                  />
                </div>
                <div className="mt-5 sm:mt-6">
                  <Button type="submit" loading={loading} className="w-full">
                    {loading ? 'Saving...' : 'Save Log'}
                  </Button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
