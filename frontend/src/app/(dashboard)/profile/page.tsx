'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useProfilePage } from '@/hooks/useProfilePage'
import {
    ProfilePersonalForm,
    ProfileProfessionalDetails,
    ProfileSidebar,
} from '@/components/features/profile'

export default function ProfilePage() {
    const router = useRouter()
    const {
        user,
        form,
        activeTab,
        setActiveTab,
        isEditing,
        setIsEditing,
        isLoading,
        handleAvatarUpload,
        onSubmit,
        resetForm,
    } = useProfilePage()

    if (!user) return null

    const avatarDisplayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'User'
    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarDisplayName)}&background=6366f1&color=ffffff`

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                    aria-label="Go back"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="md:flex md:gap-6">
                <ProfileSidebar
                    avatarUrl={user.avatarUrl || defaultAvatarUrl}
                    displayName={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()}
                    roleLabel={user.role || 'Employee'}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onAvatarUpload={handleAvatarUpload}
                    isEditing={isEditing}
                />

                <div className="flex-1">
                    <div className="bg-white shadow rounded-lg">
                        {activeTab === 'personal' && (
                            <ProfilePersonalForm
                                form={form}
                                isEditing={isEditing}
                                isLoading={isLoading}
                                onEdit={() => setIsEditing(true)}
                                onCancel={() => {
                                    setIsEditing(false)
                                    resetForm()
                                }}
                                onSubmit={onSubmit}
                            />
                        )}

                        {activeTab === 'professional' && (
                            <ProfileProfessionalDetails
                                employeeNumber={user.employee?.employeeNumber ?? null}
                                department={user.department ?? null}
                                role={user.role ?? null}
                                email={user.email ?? null}
                                hireDate={
                                    user.employee?.hireDate
                                        ? new Date(user.employee.hireDate).toLocaleDateString()
                                        : null
                                }
                                statusLabel={user.status || 'Active'}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
