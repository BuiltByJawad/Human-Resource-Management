interface SettingsActionCardProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  variant?: 'primary' | 'outline'
}

export const SettingsActionCard = ({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'primary',
}: SettingsActionCardProps) => {
  const buttonClassName =
    variant === 'outline'
      ? 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all active:scale-95 hover:scale-105 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 px-4 py-2 text-sm'
      : 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <button type="button" onClick={onAction} className={buttonClassName}>
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
