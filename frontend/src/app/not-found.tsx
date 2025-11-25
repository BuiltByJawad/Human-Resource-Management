'use client'

import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">404 - Page Not Found</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        The page you are looking for does not exist.
                    </p>
                </div>
                <div className="mt-5">
                    <Link
                        href="/dashboard"
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        Go back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
