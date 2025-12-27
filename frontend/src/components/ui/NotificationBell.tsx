"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline"
import { BellAlertIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import { notificationService, type Notification } from "@/services/notificationService"
import { useToast } from "@/components/ui/ToastProvider"

const typeColors: Record<string, string> = {
    leave: "bg-blue-100 text-blue-600",
    payroll: "bg-green-100 text-green-600",
    system: "bg-gray-100 text-gray-600",
    performance: "bg-purple-100 text-purple-600",
    training: "bg-orange-100 text-orange-600",
}

export function NotificationBell() {
    const { showToast } = useToast()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter((n) => !n.readAt).length

    const loadNotifications = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await notificationService.getNotifications()
            setNotifications(data)
        } catch {
            // Silently fail - don't show error for background fetch
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadNotifications()
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000)
        return () => clearInterval(interval)
    }, [loadNotifications])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId)
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
                )
            )
        } catch {
            showToast("Failed to mark notification as read", "error")
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead()
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
            )
            showToast("All notifications marked as read", "success")
        } catch {
            showToast("Failed to mark all as read", "error")
        }
    }

    const formatTimeAgo = (dateStr: string) => {
        const now = new Date()
        const date = new Date(dateStr)
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
                {unreadCount > 0 ? (
                    <BellAlertIcon className="h-6 w-6 text-blue-600" />
                ) : (
                    <BellIcon className="h-6 w-6 text-gray-500" />
                )}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <CheckIcon className="h-4 w-4" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading && notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.slice(0, 10).map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!notification.readAt ? "bg-blue-50/50" : ""
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${typeColors[notification.type || "system"] || typeColors.system
                                                    }`}
                                            >
                                                <BellIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm ${!notification.readAt ? "font-semibold" : ""} text-gray-900`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.readAt && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <CheckIcon className="h-4 w-4 text-gray-400" />
                                                        </button>
                                                    )}
                                                </div>
                                                {notification.message && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                                {notification.link && (
                                                    <Link
                                                        href={notification.link}
                                                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                                        onClick={() => {
                                                            setIsOpen(false)
                                                            if (!notification.readAt) handleMarkAsRead(notification.id)
                                                        }}
                                                    >
                                                        View details →
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 10 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                            <span className="text-xs text-gray-500">
                                Showing 10 of {notifications.length} notifications
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
