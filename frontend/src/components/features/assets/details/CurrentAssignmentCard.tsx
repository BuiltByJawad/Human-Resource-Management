import type { AssetAssignment } from '@/services/assets/types'

interface CurrentAssignmentCardProps {
  assignment: AssetAssignment
}

export const CurrentAssignmentCard = ({ assignment }: CurrentAssignmentCardProps) => (
  <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
    <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">Currently Assigned To</h3>
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
        {assignment.employee.firstName[0]}
        {assignment.employee.lastName[0]}
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-900">
          {assignment.employee.firstName} {assignment.employee.lastName}
        </p>
        <p className="text-sm text-gray-600">
          ID: {assignment.employee.employeeNumber} • Since{' '}
          {new Date(assignment.assignedDate).toLocaleDateString()}
        </p>
        {assignment.notes && (
          <p className="text-sm text-gray-500 mt-1 italic">&quot;{assignment.notes}&quot;</p>
        )}
      </div>
    </div>
  </div>
)
