import type { ReactNode } from 'react'

interface SecuritySectionProps {
  onChangePassword: () => void
  mfaStatus: ReactNode
  mfaControls: ReactNode
  id?: string
}

export const SecuritySection = ({ onChangePassword, mfaStatus, mfaControls, id }: SecuritySectionProps) => (
  <div id={id} className="bg-white shadow rounded-lg p-6 border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900">Security</h2>
    <p className="mt-1 text-sm text-gray-500">Manage your password and keep your account secure.</p>

    <div className="mt-4 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Password</h3>
        <p className="mt-1 text-sm text-gray-500">Update your password regularly to keep your account safe.</p>
        <div className="mt-3">
          <button
            onClick={onChangePassword}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Change password
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-medium text-gray-900">Two-factor authentication</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add an extra layer of security to your account by requiring a code from an authenticator app when you sign in.
        </p>
        <div className="mt-2 text-sm text-gray-700">{mfaStatus}</div>
        <div className="mt-3">{mfaControls}</div>
      </div>
    </div>
  </div>
)
