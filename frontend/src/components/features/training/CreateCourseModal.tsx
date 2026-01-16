"use client"

import { Modal } from '@/components/ui/Modal'
import { Input, TextArea } from '@/components/ui/FormComponents'

interface CourseFormState {
  title: string
  description: string
  contentUrl: string
  duration: string
}

interface CreateCourseModalProps {
  isOpen: boolean
  onClose: () => void
  courseForm: CourseFormState
  setCourseForm: (next: CourseFormState) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function CreateCourseModal({ isOpen, onClose, courseForm, setCourseForm, onSubmit, isSubmitting }: CreateCourseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Training Course">
      <div className="space-y-4">
        <Input
          label="Course Title"
          required
          value={courseForm.title}
          onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
          placeholder="e.g., Safety Compliance Training"
        />
        <TextArea
          label="Description"
          value={courseForm.description}
          onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
          placeholder="Brief description of the course content..."
          rows={3}
        />
        <Input
          label="Content URL"
          value={courseForm.contentUrl}
          onChange={(e) => setCourseForm({ ...courseForm, contentUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=... or PDF link"
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={courseForm.duration}
          onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
          placeholder="e.g., 60"
        />
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
