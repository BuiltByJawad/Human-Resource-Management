import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Modal } from '@/components/ui/Modal'
import { Input, TextArea, Select } from '@/components/ui/FormComponents'
import type { ComplianceRule } from '@/services/compliance/types'

const ruleSchema = yup.object().shape({
  name: yup.string().required('Rule name is required'),
  description: yup.string(),
  type: yup.string().required('Rule type is required'),
  threshold: yup.number().required('Threshold is required').min(0, 'Threshold must be positive'),
})

type RuleFormData = yup.InferType<typeof ruleSchema>
export type RuleFormField = keyof RuleFormData

interface RuleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<ComplianceRule>) => Promise<void>
  loading?: boolean
  apiErrors?: Partial<Record<RuleFormField, string>>
  onClearApiErrors?: (field: RuleFormField) => void
}

export function RuleForm({ isOpen, onClose, onSubmit, loading, apiErrors, onClearApiErrors }: RuleFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<RuleFormData>({
    resolver: yupResolver(ruleSchema) as never,
    defaultValues: {
      name: '',
      description: '',
      type: 'max_hours_per_week',
      threshold: 48,
    },
  })

  useEffect(() => {
    if (!apiErrors) return
    ;(Object.entries(apiErrors) as [RuleFormField, string | undefined][]).forEach(([field, message]) => {
      if (message) {
        setError(field, { type: 'server', message })
      } else {
        clearErrors(field)
      }
    })
  }, [apiErrors, setError, clearErrors])

  const handleFieldFocus = (field: RuleFormField) => {
    clearErrors(field)
    onClearApiErrors?.(field)
  }

  const onFormSubmit = async (data: RuleFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Compliance Rule">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-6">
        <Input
          label="Rule Name"
          placeholder="e.g. Max Hours Per Week"
          required
          error={errors.name?.message}
          {...register('name', {
            onChange: () => handleFieldFocus('name'),
          })}
          onBlur={() => handleFieldFocus('name')}
        />
        <TextArea
          label="Description"
          placeholder="Description of the rule"
          error={errors.description?.message}
          {...register('description', {
            onChange: () => handleFieldFocus('description'),
          })}
          onBlur={() => handleFieldFocus('description')}
        />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label="Rule Type"
              value={field.value}
              onChange={(value) => {
                handleFieldFocus('type')
                field.onChange(value)
              }}
              options={[{ value: 'max_hours_per_week', label: 'Max Hours Per Week' }]}
              required
              error={errors.type?.message}
            />
          )}
        />
        <Input
          label="Threshold (Hours)"
          type="number"
          required
          error={errors.threshold?.message}
          {...register('threshold', {
            onChange: () => handleFieldFocus('threshold'),
          })}
          onBlur={() => handleFieldFocus('threshold')}
        />
        <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 pb-2 flex justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Create Rule'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
