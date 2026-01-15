"use client"

import { Suspense } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { EmployeeForm, type Employee } from '@/components/hrm/EmployeeComponents'
import EmployeeDetailsModal from '@/components/hrm/EmployeeDetailsModal'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmployeesToolbar, EmployeesListSection } from '@/components/hrm/EmployeesPageComponents'
import type { Department, EmployeesPage, Role } from '@/types/hrm'
import { useEmployeesPage } from '@/hooks/useEmployeesPage'

interface EmployeesPageClientProps {
  initialDepartments?: Department[]
  initialRoles?: Role[]
  initialEmployees?: EmployeesPage | null
}

function EmployeesContent({
  initialDepartments = [],
  initialRoles = [],
  initialEmployees
}: EmployeesPageClientProps) {
  const {
    departments,
    roles,
    employees,
    pagination,
    searchTerm,
    filterStatus,
    filterDepartment,
    loading,
    isModalOpen,
    editingEmployee,
    viewingEmployee,
    pendingDelete,
    setViewingEmployee,
    setIsModalOpen,
    onSearchChange,
    onFilterStatusChange,
    onFilterDepartmentChange,
    onPageChange,
    onCreate,
    onEdit,
    onSubmit,
    onDeleteRequest,
    onConfirmDelete,
    onSendInvite,
  } = useEmployeesPage({ initialDepartments, initialRoles, initialEmployees })

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx_auto space-y-6">
            <EmployeesToolbar
              totalEmployees={pagination.total}
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              filterStatus={filterStatus}
              onFilterStatusChange={onFilterStatusChange}
              filterDepartment={filterDepartment}
              onFilterDepartmentChange={onFilterDepartmentChange}
              departments={departments}
              onCreateEmployee={onCreate}
            />

            <EmployeesListSection
              employees={employees}
              loading={loading}
              pagination={pagination}
              onPageChange={onPageChange}
              onViewEmployee={setViewingEmployee}
              onEditEmployee={onEdit}
              onDeleteEmployee={onDeleteRequest}
              onSendInvite={onSendInvite}
            />
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        size="lg"
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={onSubmit}
          onCancel={() => setIsModalOpen(false)}
          departments={departments}
          roles={roles}
        />
      </Modal>

      {viewingEmployee && (
        <EmployeeDetailsModal
          isOpen={!!viewingEmployee}
          onClose={() => setViewingEmployee(undefined)}
          employee={viewingEmployee}
        />
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Remove employee?"
        message={
          pendingDelete ? `${pendingDelete.firstName} ${pendingDelete.lastName} will be removed from your organization.` : ''
        }
        confirmText="Delete"
        onConfirm={onConfirmDelete}
        onClose={() => setPendingDelete(null)}
        type="danger"
      />
    </div>
  )
}

export function EmployeesPageClient(props: EmployeesPageClientProps) {
  return (
    <Suspense fallback={<div className="p-6">Loading employees...</div>}>
      <EmployeesContent {...props} />
    </Suspense>
  )
}
