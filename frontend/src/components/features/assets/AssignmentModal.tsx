import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button, Select, TextArea } from '@/components/ui/FormComponents'
import type { Resolver } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { Employee } from '@/services/employees/types'

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (employeeId: string, notes: string) => Promise<void>
  employees: Employee[]
}

const assignmentSchema = yup.object({
  employeeId: yup.string().required('Employee is required'),
  notes: yup.string(),
})

interface AssignmentFormData {
  employeeId: string
  notes?: string
}

export const AssignmentModal = ({ isOpen, onClose, onAssign, employees }: AssignmentModalProps) => {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: yupResolver(assignmentSchema) as Resolver<AssignmentFormData>,
    defaultValues: {
      employeeId: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onFormSubmit = async (data: AssignmentFormData) => {
    setLoading(true)
    try {
      await onAssign(data.employeeId, data.notes || '')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const employeeOptions = (employees ?? []).map((emp) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName} (${emp.employeeNumber})`,
  }))

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
                Assign Asset
              </Dialog.Title>
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <div>
                  <Controller
                    control={control}
                    name="employeeId"
                    render={({ field }) => (
                      <Select
                        label="Select Employee"
                        value={field.value}
                        onChange={field.onChange}
                        options={employeeOptions}
                        required
                        placeholder="Select an employee..."
                        error={errors.employeeId?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <TextArea
                    label="Notes"
                    placeholder="Condition, accessories included, etc."
                    rows={3}
                    error={errors.notes?.message}
                    {...register('notes')}
                  />
                </div>
                <div className="mt-5 sm:mt-6">
                  <Button type="submit" loading={loading} className="w-full">
                    {loading ? 'Assigning...' : 'Confirm Assignment'}
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
