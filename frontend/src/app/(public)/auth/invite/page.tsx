import Link from 'next/link'

export default function InviteHelpPage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Request access</h1>
          <p className="text-sm text-gray-600">
            Access to this system is granted via invitation. Please contact your HR administrator to request an invite link.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="w-full inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to login
          </Link>
          <Link href="/auth/request-password-reset" className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
      </div>
    </section>
  )
}
