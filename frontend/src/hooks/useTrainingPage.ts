'use client'

import { useCallback, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import type { TrainingCourse } from '@/services/training/types'
import { createCourse, assignCourse } from '@/services/training/api'

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

export interface UseTrainingPageProps {
  initialCourses: TrainingCourse[]
  employees: EmployeeOption[]
}

export function useTrainingPage({ initialCourses, employees }: UseTrainingPageProps) {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<TrainingCourse[]>(initialCourses)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [courseForm, setCourseForm] = useState({ title: '', description: '', contentUrl: '', duration: '' })
  const [assignForm, setAssignForm] = useState({ employeeId: '' })

  const handleCreateCourse = useCallback(async () => {
    if (!courseForm.title.trim()) {
      showToast('Course title is required', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const newCourse = await createCourse({
        title: courseForm.title,
        description: courseForm.description || undefined,
        contentUrl: courseForm.contentUrl || undefined,
        duration: courseForm.duration ? parseInt(courseForm.duration, 10) : undefined,
      })

      if (newCourse) {
        setCourses((prev) => [...prev, newCourse])
        showToast('Course created successfully', 'success')
        setShowCreateModal(false)
        setCourseForm({ title: '', description: '', contentUrl: '', duration: '' })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create course'
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [courseForm, showToast])

  const handleAssignCourse = useCallback(async () => {
    if (!selectedCourse || !assignForm.employeeId) {
      showToast('Please select an employee', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await assignCourse(assignForm.employeeId, selectedCourse.id)
      showToast('Course assigned successfully', 'success')
      setShowAssignModal(false)
      setAssignForm({ employeeId: '' })
      setSelectedCourse(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to assign course'
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [assignForm.employeeId, selectedCourse, showToast])

  const openAssignModal = (course: TrainingCourse) => {
    setSelectedCourse(course)
    setShowAssignModal(true)
  }

  return {
    courses,
    employees,
    showCreateModal,
    setShowCreateModal,
    showAssignModal,
    setShowAssignModal,
    selectedCourse,
    setSelectedCourse,
    isSubmitting,
    courseForm,
    setCourseForm,
    assignForm,
    setAssignForm,
    handleCreateCourse,
    handleAssignCourse,
    openAssignModal,
  }
}
