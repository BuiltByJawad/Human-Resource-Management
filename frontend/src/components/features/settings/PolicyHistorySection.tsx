'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchPolicyHistory } from '@/services/settings/api'
import type { PolicyHistoryEntry } from '@/services/settings/types'

const formatName = (entry: PolicyHistoryEntry) => {
  const user = entry.user
  const first = user.firstName?.trim()
  const last = user.lastName?.trim()
  const name = [first, last].filter(Boolean).join(' ')
  return name || user.email
}

export function PolicyHistorySection() {
  const [items, setItems] = useState<PolicyHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchPolicyHistory()
        if (isMounted) {
          setItems(data)
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load history'
          setError(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const rows = useMemo(() => {
    return items.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actor: formatName(entry),
      role: entry.user.role?.name ?? '—',
      time: new Date(entry.createdAt).toLocaleString(),
    }))
  }, [items])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Policy Change History</h2>
        <p className="text-sm text-gray-500">Tracks updates to privacy policy and terms of service.</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading history…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">No policy changes recorded yet.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-gray-600">{row.time}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.action}</td>
                  <td className="px-4 py-3 text-gray-700">{row.actor}</td>
                  <td className="px-4 py-3 text-gray-600">{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
