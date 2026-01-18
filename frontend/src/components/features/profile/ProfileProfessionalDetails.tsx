interface ProfileProfessionalDetailsProps {
  employeeNumber?: string | null
  department?: string | null
  role?: string | null
  email?: string | null
  hireDate?: string | null
  statusLabel?: string | null
}

export const ProfileProfessionalDetails = ({
  employeeNumber,
  department,
  role,
  email,
  hireDate,
  statusLabel,
}: ProfileProfessionalDetailsProps) => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-6">Professional Details</h2>
    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-500">Employee ID</label>
        <p className="mt-1 text-sm text-gray-900">{employeeNumber || 'N/A'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500">Department</label>
        <p className="mt-1 text-sm text-gray-900">{department || 'N/A'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500">Role</label>
        <p className="mt-1 text-sm text-gray-900">{role || 'N/A'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500">Email</label>
        <p className="mt-1 text-sm text-gray-900">{email || 'N/A'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500">Hire Date</label>
        <p className="mt-1 text-sm text-gray-900">{hireDate || 'N/A'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500">Status</label>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {statusLabel || 'Active'}
        </span>
      </div>
    </div>
  </div>
)
