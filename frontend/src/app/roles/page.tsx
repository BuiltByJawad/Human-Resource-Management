'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { Role, Permission, RoleList, RoleForm } from '@/components/hrm/RoleComponents'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/FormComponents'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function RolesPage() {
    const { token } = useAuthStore()
    const { showToast } = useToast()

    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({})
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)

    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

    const fetchData = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            // Fetch roles
            try {
                const rolesRes = await axios.get(`${API_URL}/roles`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (rolesRes.data.success) {
                    setRoles(rolesRes.data.data)
                }
            } catch (error: any) {
                if (error.response?.status === 404) {
                    setRoles([])
                } else {
                    console.error('Failed to fetch roles', error)
                }
            }

            // Fetch permissions
            try {
                const permsRes = await axios.get(`${API_URL}/roles/permissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (permsRes.data.success) {
                    // Correctly access data and grouped from response
                    // Response structure: { success: true, data: Permission[], grouped: Record<string, Permission[]> }
                    setPermissions(Array.isArray(permsRes.data.data) ? permsRes.data.data : [])
                    setGroupedPermissions(permsRes.data.grouped || {})
                }
            } catch (error: any) {
                // Handle 404 or other errors gracefully - permissions may not be available
                if (error.response?.status === 404) {
                    console.warn('Permissions endpoint not available')
                } else {
                    console.error('Failed to fetch permissions', error)
                }
                setPermissions([])
                setGroupedPermissions({})
            }
        } catch (error) {
            console.error('Unexpected error in fetchData', error)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreate = () => {
        setEditingRole(null)
        setIsModalOpen(true)
    }

    const handleEdit = (role: Role) => {
        setEditingRole(role)
        setIsModalOpen(true)
    }

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role)
        setIsDeleteOpen(true)
    }

    const handleSubmit = async (data: Partial<Role> & { permissionIds?: string[] }) => {
        if (!token) return
        setActionLoading(true)
        try {
            if (editingRole) {
                await axios.put(`${API_URL}/roles/${editingRole.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                showToast('Role updated successfully', 'success')
            } else {
                await axios.post(`${API_URL}/roles`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                showToast('Role created successfully', 'success')
            }
            setIsModalOpen(false)
            fetchData()
        } catch (error: any) {
            console.error('Operation failed', error)
            const msg = error.response?.data?.message || error.response?.data?.error || 'Operation failed'
            showToast(msg, 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!token || !roleToDelete) return
        setActionLoading(true)
        try {
            await axios.delete(`${API_URL}/roles/${roleToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            showToast('Role deleted successfully', 'success')
            setIsDeleteOpen(false)
            fetchData()
        } catch (error: any) {
            console.error('Delete failed', error)
            const msg = error.response?.data?.message || error.response?.data?.error || 'Delete failed'
            showToast(msg, 'error')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
                                <p className="text-sm text-gray-500">Manage user roles and access control</p>
                            </div>
                            <Button
                                onClick={handleCreate}
                                className="flex items-center"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                Add Role
                            </Button>
                        </div>

                        <RoleList
                            roles={roles}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            loading={loading}
                        />
                    </div>
                </main>
            </div>

            <RoleForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingRole}
                permissions={permissions}
                groupedPermissions={groupedPermissions}
                loading={actionLoading}
            />

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Role"
                message={`Are you sure you want to delete "${roleToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                loading={actionLoading}
            />
        </div>
    )
}
