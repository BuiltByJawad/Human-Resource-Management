import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button, DatePicker, Input } from '@/components/ui/FormComponents'
import { CreatableSelect } from '@/components/ui/CreatableSelect'
import type { Resolver } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { Asset } from '@/services/assets/types'

interface AssetFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AssetFormData) => Promise<void>
  initialData?: Asset
}

const ASSET_TYPES = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Desktop', label: 'Desktop' },
  { value: 'Monitor', label: 'Monitor' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Accessory', label: 'Accessory' },
  { value: 'License', label: 'License' },
]

const assetSchema = yup.object({
  name: yup.string().required('Asset name is required'),
  serialNumber: yup.string().required('Serial number is required'),
  type: yup.string().required('Type is required'),
  purchaseDate: yup.string().required('Purchase date is required'),
  purchasePrice: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .notRequired(),
})

export interface AssetFormData {
  name: string
  serialNumber: string
  type: string
  purchaseDate: string
  purchasePrice?: number | null
}

export const AssetForm = ({ isOpen, onClose, onSubmit, initialData }: AssetFormProps) => {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: yupResolver(assetSchema) as Resolver<AssetFormData>,
    defaultValues: {
      name: '',
      serialNumber: '',
      type: 'Laptop',
      purchaseDate: '',
      purchasePrice: null,
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        serialNumber: initialData.serialNumber,
        type: initialData.type,
        purchaseDate: initialData.purchaseDate
          ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
          : '',
        purchasePrice: initialData.purchasePrice || null,
      })
    } else {
      reset({
        name: '',
        serialNumber: '',
        type: 'Laptop',
        purchaseDate: '',
        purchasePrice: null,
      })
    }
  }, [initialData, isOpen, reset])

  const onFormSubmit = async (data: AssetFormData) => {
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
            <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                {initialData ? 'Edit Asset' : 'Add New Asset'}
              </Dialog.Title>
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <div>
                  <Input
                    label="Asset Name"
                    placeholder="e.g. MacBook Pro M3"
                    required
                    error={errors.name?.message}
                    {...register('name')}
                  />
                </div>
                <div>
                  <Input
                    label="Serial Number"
                    required
                    error={errors.serialNumber?.message}
                    {...register('serialNumber')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <CreatableSelect
                          label="Type"
                          value={field.value}
                          onChange={field.onChange}
                          options={ASSET_TYPES}
                          required
                          error={errors.type?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Input
                      label="Price"
                      type="number"
                      placeholder="0.00"
                      error={errors.purchasePrice?.message}
                      {...register('purchasePrice')}
                    />
                  </div>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <DatePicker
                        label="Purchase Date"
                        required
                        value={field.value}
                        onChange={(date) =>
                          field.onChange(date ? date.toISOString().split('T')[0] : '')
                        }
                        error={errors.purchaseDate?.message}
                      />
                    )}
                  />
                </div>
                <div className="mt-5 sm:mt-6">
                  <Button type="submit" loading={loading} className="w-full">
                    {loading ? 'Saving...' : 'Save Asset'}
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
