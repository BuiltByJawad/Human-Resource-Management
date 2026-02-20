"use client"

import { TrainingHeader } from '@/components/features/training/TrainingHeader'
import { CoursesGrid } from '@/components/features/training/CoursesGrid'
import { CreateCourseModal } from '@/components/features/training/CreateCourseModal'
import { AssignCourseModal } from '@/components/features/training/AssignCourseModal'
import { useTrainingPage } from '@/hooks/useTrainingPage'
import type { TrainingCourse } from '@/services/training/api'

interface TrainingPageClientProps {
  initialCourses: TrainingCourse[]
  employees: { id: string; firstName: string; lastName: string }[]
}

export function TrainingPageClient({ initialCourses, employees }: TrainingPageClientProps) {
  const {
    courses,
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
  } = useTrainingPage({ initialCourses, employees })

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <TrainingHeader title="Training Management" subtitle="Create and manage training courses" />

          <CoursesGrid courses={courses} onCreateCourse={() => setShowCreateModal(true)} onAssign={openAssignModal} />
        </div>
      </div>

      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCourseForm({ title: '', description: '', contentUrl: '', duration: '' })
        }}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        onSubmit={handleCreateCourse}
        isSubmitting={isSubmitting}
      />

      <AssignCourseModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          setAssignForm({ employeeId: '' })
          setSelectedCourse(null)
        }}
        employees={employees}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        onSubmit={handleAssignCourse}
        isSubmitting={isSubmitting}
        courseTitle={selectedCourse?.title}
      />
    </>
  )
}
