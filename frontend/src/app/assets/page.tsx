'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { Asset, AssetCard, AssetForm, AssignmentModal } from '@/components/hrm/AssetComponents'
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/FormComponents'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function AssetPage() {
    const { token } = useAuthStore()
    const { showToast } = useToast()

    const [assets, setAssets] = useState<Asset[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

    const fetchAssets = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.append('status', filterStatus)
            if (searchQuery) params.append('search', searchQuery)

            const res = await fetch(`${API_URL}/assets?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setAssets(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch assets', error)
            showToast('Failed to load assets', 'error')
        } finally {
            setLoading(false)
        }
    }, [token, filterStatus, searchQuery, showToast])

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setEmployees(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch employees', error)
        }
    }, [token])

    useEffect(() => {
        if (token) {
            fetchAssets()
            fetchEmployees()
        }
    }, [token, fetchAssets, fetchEmployees])

    const handleCreateAsset = async (assetData: any) => {
        try {
            const res = await fetch(`${API_URL}/assets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(assetData)
            })

            if (res.ok) {
                showToast('Asset created successfully', 'success')
                fetchAssets()
            } else {
                const err = await res.json()
                throw new Error(err.message)
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to create asset', 'error')
            throw error
        }
    }

    const handleUpdateAsset = async (assetData: any) => {
        if (!selectedAsset) return
        try {
            const res = await fetch(`${API_URL}/assets/${selectedAsset.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(assetData)
            })

            if (res.ok) {
                showToast('Asset updated successfully', 'success')
                fetchAssets()
            } else {
                throw new Error('Failed to update asset')
            }
        } catch (error: any) {
            showToast(error.message, 'error')
            throw error
        }
    }

    const handleAssignAsset = async (employeeId: string, notes: string) => {
        if (!selectedAsset) return
        try {
            const res = await fetch(`${API_URL}/assets/${selectedAsset.id}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ employeeId, notes })
            })

            if (res.ok) {
                showToast('Asset assigned successfully', 'success')
                fetchAssets()
            } else {
                throw new Error('Failed to assign asset')
            }
        } catch (error: any) {
            showToast(error.message, 'error')
            throw error
        }
    }

    const handleReturnAsset = async (asset: Asset) => {
        if (!confirm(`Are you sure you want to return ${asset.name}?`)) return
        try {
            const res = await fetch(`${API_URL}/assets/${asset.id}/return`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                showToast('Asset returned successfully', 'success')
                fetchAssets()
            } else {
                throw new Error('Failed to return asset')
            }
        } catch (error: any) {
            showToast(error.message, 'error')
        }
    }

    const stats = {
        total: assets.length,
        assigned: assets.filter(a => a.status === 'assigned').length,
        available: assets.filter(a => a.status === 'available').length,
        maintenance: assets.filter(a => a.status === 'maintenance').length
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
                                <p className="text-sm text-gray-500">Track hardware, software, and assignments.</p>
                            </div>
                            <Button
                                onClick={() => { setSelectedAsset(null); setIsFormOpen(true) }}
                                className="flex items-center"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add Asset
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Total Assets</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Assigned</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Available</p>
                                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500">Maintenance</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search assets..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="available">Available</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="retired">Retired</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : assets.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No assets found matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assets.map(asset => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        onAssign={(a) => { setSelectedAsset(a); setIsAssignModalOpen(true) }}
                                        onReturn={handleReturnAsset}
                                        onEdit={(a) => { setSelectedAsset(a); setIsFormOpen(true) }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <AssetForm
                        isOpen={isFormOpen}
                        onClose={() => { setIsFormOpen(false); setSelectedAsset(null) }}
                        onSubmit={selectedAsset ? handleUpdateAsset : handleCreateAsset}
                        initialData={selectedAsset || undefined}
                    />

                    <AssignmentModal
                        isOpen={isAssignModalOpen}
                        onClose={() => { setIsAssignModalOpen(false); setSelectedAsset(null) }}
                        onAssign={handleAssignAsset}
                        employees={employees}
                    />
                </main>
            </div>
        </div>
    )
}
