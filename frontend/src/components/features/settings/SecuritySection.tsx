interface SecuritySectionProps {
  onChangePassword: () => void
}

export const SecuritySection = ({ onChangePassword }: SecuritySectionProps) => (
  <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900">Security</h2>
    <p className="mt-1 text-sm text-gray-500">Manage your password and keep your account secure.</p>
    <div className="mt-4">
      <button
        onClick={onChangePassword}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Change password
      </button>
    </div>
  </div>
)
