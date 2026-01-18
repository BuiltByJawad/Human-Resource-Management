import { UserCircleIcon } from '@heroicons/react/24/outline'
import type { AssetAssignment } from '@/services/assets/types'

interface AssetHistoryTimelineProps {
  assignments: AssetAssignment[]
}

export const AssetHistoryTimeline = ({ assignments }: AssetHistoryTimelineProps) => {
  if (assignments.length === 0) {
    return <p className="text-center text-gray-500 py-8">No assignment history found.</p>
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {assignments.map((assignment, idx) => (
          <li key={assignment.id}>
            <div className="relative pb-8">
              {idx !== assignments.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      assignment.returnedDate ? 'bg-gray-400' : 'bg-blue-500'
                    }`}
                  >
                    <UserCircleIcon className="h-5 w-5 text-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Assigned to{' '}
                      <span className="font-medium text-gray-900">
                        {assignment.employee.firstName} {assignment.employee.lastName}
                      </span>
                    </p>
                    {assignment.notes && (
                      <p className="mt-1 text-sm text-gray-500 italic">&quot;{assignment.notes}&quot;</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={assignment.assignedDate}>
                      {new Date(assignment.assignedDate).toLocaleDateString()}
                    </time>
                    {assignment.returnedDate && (
                      <>
                        <span className="mx-1">-</span>
                        <time dateTime={assignment.returnedDate}>
                          {new Date(assignment.returnedDate).toLocaleDateString()}
                        </time>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
