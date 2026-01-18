import { Input } from '@/components/ui/FormComponents'
import { Modal } from '@/components/ui/Modal'
import type { ChangePasswordFormValues } from '@/services/settings/types'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  register: UseFormRegister<ChangePasswordFormValues>
  errors: FieldErrors<ChangePasswordFormValues>
  isChangingPassword: boolean
}

export const PasswordChangeModal = ({
  isOpen,
  onClose,
  onSubmit,
  register,
  errors,
  isChangingPassword,
}: PasswordChangeModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Current Password"
        type="password"
        required
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="New Password"
        type="password"
        required
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirm New Password"
        type="password"
        required
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
        <button
          type="submit"
          disabled={isChangingPassword}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
        >
          {isChangingPassword ? 'Changing...' : 'Change Password'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  </Modal>
)
