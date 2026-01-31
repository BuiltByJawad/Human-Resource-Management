"use client"

import { EmployeeForm, EmployeeDetailsModal, EmployeesToolbar, EmployeesListSection } from '@/components/features/employees'
import type { Employee, Department, EmployeesPage, Role } from '@/types/hrm'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEmployeesPage } from '@/hooks/useEmployeesPage'
import DashboardShell from '@/components/ui/DashboardShell'

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
    <DashboardShell>
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
          pendingDelete ? `${pendingDelete.firstName} ${pendingDelete.lastName} will be removed from your workspace.` : ''
        }
        confirmText="Delete"
        onConfirm={onConfirmDelete}
        onClose={() => setPendingDelete(null)}
        type="danger"
      />
    </DashboardShell>
  )
}

export function EmployeesPageClient(props: EmployeesPageClientProps) {
  return <EmployeesContent {...props} />
}
