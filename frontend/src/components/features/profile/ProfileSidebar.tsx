import AvatarUpload from '@/components/ui/AvatarUpload'
import { BriefcaseIcon, UserCircleIcon } from '@heroicons/react/24/outline'

interface ProfileSidebarProps {
  avatarUrl: string
  displayName: string
  roleLabel: string
  activeTab: 'personal' | 'professional'
  onTabChange: (tab: 'personal' | 'professional') => void
  onAvatarUpload: (file: File) => void
  isEditing: boolean
}

export const ProfileSidebar = ({
  avatarUrl,
  displayName,
  roleLabel,
  activeTab,
  onTabChange,
  onAvatarUpload,
  isEditing,
}: ProfileSidebarProps) => (
  <div className="w-full md:w-64 mb-6 md:mb-0">
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 text-center border-b border-gray-200">
        <div className="flex justify-center">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            onUpload={onAvatarUpload}
            disabled={!isEditing}
            className="flex-col !gap-4"
          />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{displayName}</h3>
        <p className="text-sm text-gray-500">{roleLabel}</p>
      </div>
      <nav className="p-2 space-y-1">
        <button
          onClick={() => onTabChange('personal')}
          className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === 'personal' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <UserCircleIcon className="mr-3 h-5 w-5" />
          Personal Information
        </button>
        <button
          onClick={() => onTabChange('professional')}
          className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === 'professional' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BriefcaseIcon className="mr-3 h-5 w-5" />
          Professional Details
        </button>
      </nav>
    </div>
  </div>
)
