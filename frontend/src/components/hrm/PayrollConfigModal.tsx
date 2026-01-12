'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, Cog6ToothIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

import type { PayrollConfig, PayrollConfigItem } from '@/lib/hrmData'

type Tab = 'allowances' | 'deductions'

type PayrollConfigModalProps = {
	isOpen: boolean
	onClose: () => void
	loading?: boolean
	initialConfig?: PayrollConfig | null
	onSave: (config: PayrollConfig) => Promise<void>
	onDelete?: () => Promise<void>
	deleteLabel?: string
}

const emptyConfig: PayrollConfig = { allowances: [], deductions: [] }

type DraftPayrollConfigItem = PayrollConfigItem & { id: string }
type DraftPayrollConfig = { allowances: DraftPayrollConfigItem[]; deductions: DraftPayrollConfigItem[] }

const createStableId = (): string => {
	try {
		return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(16).slice(2)}`
	} catch {
		return `${Date.now()}-${Math.random().toString(16).slice(2)}`
	}
}

const createEmptyItem = (): DraftPayrollConfigItem => ({
	id: createStableId(),
	name: '',
	type: 'percentage',
	value: 0,
})

const normalizeConfig = (config: PayrollConfig | null | undefined): DraftPayrollConfig => {
	const allowancesRaw = Array.isArray(config?.allowances) ? config.allowances : []
	const deductionsRaw = Array.isArray(config?.deductions) ? config.deductions : []
	return {
		allowances: allowancesRaw.map((it, index) => ({
			id: `${createStableId()}-a-${index}`,
			name: it?.name ?? '',
			type: it?.type === 'fixed' ? 'fixed' : 'percentage',
			value: typeof it?.value === 'number' && Number.isFinite(it.value) ? it.value : 0,
		})),
		deductions: deductionsRaw.map((it, index) => ({
			id: `${createStableId()}-d-${index}`,
			name: it?.name ?? '',
			type: it?.type === 'fixed' ? 'fixed' : 'percentage',
			value: typeof it?.value === 'number' && Number.isFinite(it.value) ? it.value : 0,
		})),
	}
}

const toPersistedConfig = (draft: DraftPayrollConfig): PayrollConfig => ({
	allowances: (Array.isArray(draft.allowances) ? draft.allowances : []).map(({ id: _id, ...rest }) => rest),
	deductions: (Array.isArray(draft.deductions) ? draft.deductions : []).map(({ id: _id, ...rest }) => rest),
})

const normalizeNumber = (value: string): number => {
	const num = Number(value)
	return Number.isFinite(num) ? num : 0
}

export default function PayrollConfigModal({
	isOpen,
	onClose,
	loading,
	initialConfig,
	onSave,
	onDelete,
	deleteLabel,
}: PayrollConfigModalProps) {
	const [tab, setTab] = useState<Tab>('allowances')
	const [draft, setDraft] = useState<DraftPayrollConfig>(normalizeConfig(emptyConfig))
	const [saving, setSaving] = useState(false)
	const [deleting, setDeleting] = useState(false)

	useEffect(() => {
		if (!isOpen) return
		setDraft(normalizeConfig(initialConfig ?? emptyConfig))
		setTab('allowances')
	}, [isOpen, initialConfig])

	const items = useMemo(() => {
		return tab === 'allowances' ? draft.allowances : draft.deductions
	}, [draft.allowances, draft.deductions, tab])

	const updateItem = (index: number, next: PayrollConfigItem) => {
		setDraft((prev) => {
			const nextItems = [...(tab === 'allowances' ? prev.allowances : prev.deductions)]
			const existing = nextItems[index]
			if (!existing) return prev
			nextItems[index] = { ...next, id: existing.id }
			return tab === 'allowances'
				? { ...prev, allowances: nextItems }
				: { ...prev, deductions: nextItems }
		})
	}

	const addItem = () => {
		setDraft((prev) => {
			return tab === 'allowances'
				? { ...prev, allowances: [...prev.allowances, createEmptyItem()] }
				: { ...prev, deductions: [...prev.deductions, createEmptyItem()] }
		})
	}

	const removeItem = (index: number) => {
		setDraft((prev) => {
			const nextItems = [...(tab === 'allowances' ? prev.allowances : prev.deductions)]
			nextItems.splice(index, 1)
			return tab === 'allowances'
				? { ...prev, allowances: nextItems }
				: { ...prev, deductions: nextItems }
		})
	}

	const canSave = useMemo(() => {
		const all = [...(Array.isArray(draft.allowances) ? draft.allowances : []), ...(Array.isArray(draft.deductions) ? draft.deductions : [])]
		if (all.length === 0) return true
		return all.every((it) => it.name.trim().length > 0 && it.value >= 0)
	}, [draft.allowances, draft.deductions])

	const handleSave = async () => {
		if (!canSave) return
		setSaving(true)
		try {
			await onSave(toPersistedConfig(draft))
			onClose()
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!onDelete) return
		setDeleting(true)
		try {
			await onDelete()
			onClose()
		} finally {
			setDeleting(false)
		}
	}

	return (
		<Transition.Root show={isOpen} as={Fragment}>
			<Dialog as="div" className="relative z-50" onClose={onClose}>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/50 transition-opacity" />
				</Transition.Child>

				<div className="fixed inset-0 z-10 overflow-y-auto">
					<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
							enterTo="opacity-100 translate-y-0 sm:scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 translate-y-0 sm:scale-100"
							leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
						>
							<Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 max-h-[90vh] overflow-y-auto">
								<div className="absolute right-0 top-0 pr-4 pt-4">
									<button
										type="button"
										className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
										onClick={onClose}
									>
										<span className="sr-only">Close</span>
										<XMarkIcon className="h-6 w-6" aria-hidden="true" />
									</button>
								</div>

								<div className="sm:flex sm:items-start">
									<div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 sm:mx-0 sm:h-12 sm:w-12">
										<Cog6ToothIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
									</div>
									<div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
										<Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
											Payroll Configuration
										</Dialog.Title>
										<p className="mt-1 text-sm text-gray-500">
											Define default allowances and deductions applied during payroll generation.
										</p>

										<div className="mt-4 flex items-center gap-2">
											<button
												type="button"
												onClick={() => setTab('allowances')}
												className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
													tab === 'allowances' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
												}`}
											>
												Allowances
											</button>
											<button
												type="button"
												onClick={() => setTab('deductions')}
												className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
													tab === 'deductions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
												}`}
											>
												Deductions
											</button>
											<div className="flex-1" />
											<button
												type="button"
												onClick={addItem}
												className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
												disabled={loading}
											>
												<PlusIcon className="h-5 w-5 mr-2" />
												Add
											</button>
										</div>

										<div className="mt-4 space-y-3">
											{items.length === 0 ? (
												<div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
													No {tab} configured.
												</div>
											) : (
												items.map((item, index) => (
													<div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
														<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
															<div className="sm:col-span-6">
																<label className="block text-xs font-medium text-gray-600">Name</label>
																<input
																	type="text"
																	value={item.name}
																	onChange={(e) => updateItem(index, { ...item, name: e.target.value })}
																	className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																	placeholder={tab === 'allowances' ? 'Housing Allowance' : 'Tax'}
																	disabled={loading}
																/>
															</div>

															<div className="sm:col-span-3">
																<label className="block text-xs font-medium text-gray-600">Type</label>
																<select
																	value={item.type}
																	onChange={(e) => {
																		const val = e.target.value
																		if (val !== 'fixed' && val !== 'percentage') return
																		updateItem(index, { ...item, type: val })
																	}}
																	className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																	disabled={loading}
																>
																	<option value="percentage">Percentage</option>
																	<option value="fixed">Fixed</option>
																</select>
															</div>

															<div className="sm:col-span-2">
																<label className="block text-xs font-medium text-gray-600">Value</label>
																<input
																	type="number"
																	min={0}
																	step="0.01"
																	value={item.value}
																	onChange={(e) => updateItem(index, { ...item, value: normalizeNumber(e.target.value) })}
																	className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
																	disabled={loading}
																/>
															</div>

															<div className="sm:col-span-1 flex sm:justify-end">
																<button
																	type="button"
																	onClick={() => removeItem(index)}
																	className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
																	disabled={loading}
																>
																	<span className="sr-only">Remove</span>
																	<TrashIcon className="h-5 w-5" />
																</button>
															</div>
														</div>
													</div>
												))
											)}
										</div>

										<div className="mt-6 flex items-center justify-end gap-3">
											{onDelete && (
												<button
													type="button"
													className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 disabled:opacity-60"
													onClick={handleDelete}
													disabled={saving || deleting || loading}
												>
													{deleting ? 'Removing...' : deleteLabel ?? 'Remove'}
												</button>
											)}
											<button
												type="button"
												className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
												onClick={onClose}
												disabled={saving || deleting || loading}
											>
												Cancel
											</button>
											<button
												type="button"
												className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
												onClick={handleSave}
												disabled={!canSave || saving || deleting || loading}
											>
												{saving ? 'Saving...' : 'Save Configuration'}
											</button>
										</div>
									</div>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	)
}
