import type { NotificationPreferences } from '@/services/settings/types'

interface NotificationsSectionProps {
  title: string
  description: string
  notifications: NotificationPreferences
  onChange: (next: NotificationPreferences) => void
  onSave: () => void
  emailInputId: string
  pushInputId: string
  saveLabel: string
}

export const NotificationsSection = ({
  title,
  description,
  notifications,
  onChange,
  onSave,
  emailInputId,
  pushInputId,
  saveLabel,
}: NotificationsSectionProps) => (
  <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    <div className="mt-4 space-y-4">
      <div className="flex items-center">
        <input
          id={emailInputId}
          name={emailInputId}
          type="checkbox"
          checked={notifications.emailNotifs}
          onChange={(e) => onChange({ ...notifications, emailNotifs: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor={emailInputId} className="ml-3 text-sm text-gray-700">
          Email notifications
        </label>
      </div>
      <div className="flex items-center">
        <input
          id={pushInputId}
          name={pushInputId}
          type="checkbox"
          checked={notifications.pushNotifs}
          onChange={(e) => onChange({ ...notifications, pushNotifs: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor={pushInputId} className="ml-3 text-sm text-gray-700">
          Push notifications
        </label>
      </div>
      <div>
        <button
          onClick={onSave}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  </div>
)
