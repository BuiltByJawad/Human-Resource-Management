import {
  CalendarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/FormComponents'
import { Card } from '@/components/ui/card'
import type { OnboardingTask } from '@/services/onboarding/types'

interface OnboardingTaskListProps {
  tasks: OnboardingTask[]
  isLoading: boolean
  isCompleting: boolean
  onComplete: (taskId: string) => void
}

export function OnboardingTaskList({ tasks, isLoading, isCompleting, onComplete }: OnboardingTaskListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-400" />
          Checklist
        </h2>
        <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
          {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((value) => (
            <div key={value} className="h-24 bg-gray-200 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <RocketLaunchIcon className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No steps defined yet</h3>
          <p className="text-gray-500 mt-1 max-w-xs mx-auto">Start building the onboarding journey for this employee.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={`group border-gray-200/60 hover:border-blue-200 hover:shadow-md transition-all duration-200 ${
                task.completedAt ? 'bg-gray-50/50 opacity-75' : 'bg-white'
              }`}
            >
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {task.completedAt && <CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
                    <p
                      className={`font-bold text-lg leading-tight ${
                        task.completedAt ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                  {task.description && (
                    <p
                      className={`text-sm ${task.completedAt ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}
                    >
                      {task.description}
                    </p>
                  )}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {task.dueDate && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md ${
                          task.completedAt ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span
                      className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${
                        task.completedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {task.completedAt ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>

                {!task.completedAt && (
                  <Button
                    onClick={() => onComplete(task.id)}
                    disabled={isCompleting}
                    variant="outline"
                    className="shrink-0 border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 font-bold active:scale-95 transition-all"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                    Mark Done
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
