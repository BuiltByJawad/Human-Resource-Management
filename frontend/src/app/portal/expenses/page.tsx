"use client"

import { useEffect, useState } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { getMyExpenses, submitExpenseClaim, ExpenseClaim } from '@/services/expenseService'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/FormComponents'

const categories = ['Travel', 'Meals', 'Equipment', 'Training', 'Other']

export default function MyExpensesPage() {
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const [claims, setClaims] = useState<ExpenseClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    amount: 0,
    currency: 'USD',
    category: 'Travel',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    receiptUrl: ''
  })

  useEffect(() => {
    const load = async () => {
      if (!user?.employee?.id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const data = await getMyExpenses(user.employee.id)
        setClaims(data || [])
      } catch (err) {
        console.error(err)
        showToast('Failed to load expenses', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.employee?.id, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.employee?.id) return
    try {
      await submitExpenseClaim({
        employeeId: user.employee.id,
        amount: form.amount,
        currency: form.currency,
        category: form.category,
        date: form.date,
        description: form.description,
        receiptUrl: form.receiptUrl || undefined
      })
      showToast('Expense submitted', 'success')
      setForm({ amount: 0, currency: 'USD', category: 'Travel', date: format(new Date(), 'yyyy-MM-dd'), description: '', receiptUrl: '' })
      const data = await getMyExpenses(user.employee.id)
      setClaims(data || [])
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to submit expense'
      showToast(message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
              <p className="text-gray-600">Submit reimbursement requests and track their status.</p>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-100 shadow p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Claim</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={form.amount}
                      onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <select
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <DatePicker
                      value={form.date}
                      onChange={(date) => setForm((prev) => ({ ...prev, date: date ? format(date, 'yyyy-MM-dd') : '' }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Receipt URL (optional)</label>
                    <input
                      type="url"
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={form.receiptUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, receiptUrl: e.target.value }))}
                    />
                  </div>
                  <button type="submit" className="w-full rounded bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700">
                    Submit Claim
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-lg border border-gray-100 shadow p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
                {loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : claims.length === 0 ? (
                  <p className="text-sm text-gray-500">No claims submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {claims.map((claim) => (
                      <div key={claim.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">
                              ${claim.amount.toFixed(2)} · {claim.category}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(claim.date), 'PP')} • {claim.status.toUpperCase()}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              claim.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : claim.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </div>
                        {claim.description && <p className="text-sm text-gray-600 mt-2">{claim.description}</p>}
                        {claim.receiptUrl && (
                          <a
                            href={claim.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 underline mt-2 inline-block"
                          >
                            View receipt
                          </a>
                        )}
                        {claim.status === 'rejected' && claim.rejectionReason && (
                          <p className="text-xs text-red-500 mt-2">Reason: {claim.rejectionReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
