interface PayrollHeaderProps {
  canViewPayrollUi: boolean
  canConfigurePayrollUi: boolean
  canManagePayrollUi: boolean
  isHydrated: boolean
  canViewPayrollAction: boolean
  canConfigurePayrollAction: boolean
  canManagePayrollAction: boolean
  onExport: () => void
  onConfigure: () => void
  onGenerate: () => void
  onLoadingPermissions: () => void
}

export function PayrollHeader({
  canViewPayrollUi,
  canConfigurePayrollUi,
  canManagePayrollUi,
  isHydrated,
  canViewPayrollAction,
  canConfigurePayrollAction,
  canManagePayrollAction,
  onExport,
  onConfigure,
  onGenerate,
  onLoadingPermissions,
}: PayrollHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage salaries, payslips, and payments.</p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <button
          onClick={() => {
            if (!canViewPayrollAction) {
              if (!isHydrated) {
                onLoadingPermissions()
              }
              return
            }
            onExport()
          }}
          disabled={isHydrated && !canViewPayrollAction}
          className={`w-full px-4 py-2 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95 sm:w-auto ${
            canViewPayrollUi
              ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20 hover:scale-105'
              : 'bg-gray-200 text-gray-400 shadow-gray-900/0 cursor-not-allowed'
          }`}
        >
          Export Period CSV
        </button>

        <button
          onClick={() => {
            if (!canConfigurePayrollAction) {
              if (!isHydrated) {
                onLoadingPermissions()
              }
              return
            }
            onConfigure()
          }}
          disabled={isHydrated && !canConfigurePayrollAction}
          className={`w-full px-4 py-2 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95 sm:w-auto ${
            canConfigurePayrollUi
              ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:scale-105'
              : 'bg-gray-200 text-gray-400 shadow-gray-900/0 cursor-not-allowed'
          }`}
        >
          Configure Payroll
        </button>

        <button
          onClick={() => {
            if (!canManagePayrollAction) {
              if (!isHydrated) {
                onLoadingPermissions()
              }
              return
            }
            onGenerate()
          }}
          disabled={isHydrated && !canManagePayrollAction}
          className={`w-full px-4 py-2 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95 sm:w-auto ${
            canManagePayrollUi
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 hover:scale-105'
              : 'bg-gray-200 text-gray-400 shadow-gray-900/0 cursor-not-allowed'
          }`}
        >
          Generate Payroll
        </button>
      </div>
    </div>
  )
}
