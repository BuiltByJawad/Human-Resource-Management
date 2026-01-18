import { PlusIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, DatePicker } from '@/components/ui/FormComponents'
import type { OnboardingTaskPayload } from '@/services/onboarding/types'

interface OnboardingTaskFormProps {
  newTask: OnboardingTaskPayload
  onChange: (next: OnboardingTaskPayload) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function OnboardingTaskForm({ newTask, onChange, onSubmit, isSubmitting }: OnboardingTaskFormProps) {
  return (
    <Card className="sticky top-0 shadow-sm border-gray-200/60">
      <CardHeader>
        <CardTitle className="text-lg">New Step</CardTitle>
        <CardDescription>Add a requirement for this employee onboarding.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step Title</label>
            <input
              className="w-full border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="e.g. System Access Setup"
              value={newTask.title}
              onChange={(event) => onChange({ ...newTask, title: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
            <textarea
              className="w-full border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[100px]"
              placeholder="What needs to be done?"
              value={newTask.description ?? ''}
              onChange={(event) => onChange({ ...newTask, description: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Date</label>
            <DatePicker
              value={newTask.dueDate || ''}
              onChange={(date) => onChange({ ...newTask, dueDate: date ? format(date, 'yyyy-MM-dd') : '' })}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            <PlusIcon className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Add Step'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
