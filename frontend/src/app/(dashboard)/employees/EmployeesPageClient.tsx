"use client"

import dynamic from 'next/dynamic'
import { EmployeeForm, EmployeesToolbar, EmployeesListSection } from '@/components/features/employees'
import type { Employee, Department, EmployeesPage, Role } from '@/types/hrm'
const Modal = dynamic(() => import('@/components/ui/Modal').then((mod) => mod.Modal), { ssr: false })
const ConfirmDialog = dynamic(() => import('@/components/ui/ConfirmDialog').then((mod) => mod.ConfirmDialog), { ssr: false })
const EmployeeDetailsModal = dynamic(
  () => import('@/components/features/employees').then((mod) => mod.EmployeeDetailsModal),
  { ssr: false }
)
import { useEmployeesPage } from '@/hooks/useEmployeesPage'

interface EmployeesPageClientProps {
  initialDepartments?: Department[]
  initialRoles?: Role[]
  initialEmployees?: EmployeesPage | null
}

function EmployeesContent({
  initialDepartments = [],
  initialRoles = [],
  initialEmployees = null,
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
    setPendingDelete,
    setViewingEmployee,
    setIsModalOpen,
    onSearchChange,
    onFilterStatusChange,
    onFilterDepartmentChange,
    onPageChange,
    onPageSizeChange,
    onCreate,
    onEdit,
    onSubmit,
    onDeleteRequest,
    onConfirmDelete,
    onSendInvite,
  } = useEmployeesPage({ initialDepartments, initialRoles, initialEmployees })

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
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
            onPageSizeChange={onPageSizeChange}
            onViewEmployee={setViewingEmployee}
            onEditEmployee={onEdit}
            onDeleteEmployee={onDeleteRequest}
            onSendInvite={onSendInvite}
          />
        </div>
      </div>

      {isModalOpen && (
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
      )}

      {viewingEmployee && (
        <EmployeeDetailsModal
          isOpen={!!viewingEmployee}
          onClose={() => setViewingEmployee(undefined)}
          employee={viewingEmployee}
        />
      )}

      {!!pendingDelete && (
        <ConfirmDialog
          isOpen={!!pendingDelete}
          title="Remove employee?"
          message={
            pendingDelete ? `${pendingDelete.firstName} ${pendingDelete.lastName} will be removed from your workspace.` : ''
          }
          confirmText="Delete"
          onConfirm={onConfirmDelete}
          onClose={() => setPendingDelete(null)}
          type="danger"
        />
      )}
    </>
  )
}

export function EmployeesPageClient(props: EmployeesPageClientProps) {
  return <EmployeesContent {...props} />
}
