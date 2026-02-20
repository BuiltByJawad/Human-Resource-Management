'use client'

interface PageSkeletonProps {
    /** Title shown in the skeleton header */
    title?: string
    /** Type of content layout */
    variant?: 'table' | 'cards' | 'dashboard' | 'form' | 'list'
    /** Number of skeleton items to show */
    itemCount?: number
}

/**
 * Reusable page skeleton component for consistent loading states across all pages.
 * Provides instant visual feedback during navigation.
 */
export default function PageSkeleton({
    title = 'Loading...',
    variant = 'table',
    itemCount = 6
}: PageSkeletonProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="flex-1 p-4 sm:p-6">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Title and actions skeleton */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-5 w-64 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="h-10 w-36 bg-blue-200 rounded-lg animate-pulse" />
                    </div>

                    {/* Filters skeleton (for table/cards variants) */}
                    {(variant === 'table' || variant === 'cards') && (
                        <div className="mb-6 flex flex-wrap gap-4">
                            <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
                            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
                            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                    )}

                    {/* Content skeleton based on variant */}
                    {variant === 'table' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Table header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                <div className="flex gap-8">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                    ))}
                                </div>
                            </div>
                            {/* Table rows */}
                            {Array.from({ length: itemCount }).map((_, i) => (
                                <div key={i} className="px-6 py-4 border-b border-gray-50 flex gap-8 items-center">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                                </div>
                            ))}
                        </div>
                    )}

                    {variant === 'cards' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: itemCount }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 bg-gray-200 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                            <div className="h-3 w-24 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-gray-100 rounded" />
                                        <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                        <div className="h-6 w-16 bg-gray-200 rounded-full" />
                                        <div className="h-6 w-20 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {variant === 'dashboard' && (
                        <>
                            {/* Stats cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-4 w-24 bg-gray-200 rounded" />
                                            <div className="h-10 w-10 bg-gray-100 rounded-full" />
                                        </div>
                                        <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                                        <div className="h-3 w-20 bg-gray-100 rounded" />
                                    </div>
                                ))}
                            </div>
                            {/* Activity cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-6" />
                                    <div className="space-y-4">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                                                <div className="flex-1">
                                                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                                                    <div className="h-3 w-1/3 bg-gray-100 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-6" />
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                                                <div className="flex-1">
                                                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
                                                    <div className="h-3 w-1/3 bg-gray-100 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {variant === 'form' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
                            <div className="space-y-6">
                                {Array.from({ length: itemCount }).map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                                        <div className="h-10 w-full bg-gray-100 rounded-lg" />
                                    </div>
                                ))}
                                <div className="flex gap-3 pt-4">
                                    <div className="h-10 w-24 bg-blue-200 rounded-lg animate-pulse" />
                                    <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}

                    {variant === 'list' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                            {Array.from({ length: itemCount }).map((_, i) => (
                                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                                    <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                                    <div className="flex-1">
                                        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                                        <div className="h-3 w-32 bg-gray-100 rounded" />
                                    </div>
                                    <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination skeleton */}
                    {(variant === 'table' || variant === 'cards') && (
                        <div className="mt-6 flex justify-center">
                            <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
