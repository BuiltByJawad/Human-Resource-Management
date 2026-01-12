import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { useOrgStore } from '@/store/useOrgStore'
import { useAuthStore } from '@/store/useAuthStore'
import { downloadPayslipPdf, downloadPayslipsCsv } from '@/lib/hrmData'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'

interface PayslipModalProps {
    isOpen: boolean
    onClose: () => void
    payroll: any // Type this properly in a real app
}

export const PayslipModal = ({ isOpen, onClose, payroll }: PayslipModalProps) => {
    const { companyName, companyAddress } = useOrgStore()
    const { token } = useAuthStore()
    const { showToast } = useToast()

    if (!payroll) return null

    const handlePrint = () => {
        window.print()
    }

    const handleDownloadPdf = async () => {
        try {
            await downloadPayslipPdf(String(payroll.id), token ?? undefined)
            showToast('Payslip downloaded', 'success')
        } catch (error: unknown) {
            handleCrudError({ error, resourceLabel: 'Payslip PDF export', showToast })
        }
    }

    const handleDownloadCsv = async () => {
        try {
            const employeeId = payroll?.employee?.id
            await downloadPayslipsCsv(employeeId ? String(employeeId) : undefined, token ?? undefined)
            showToast('Payslips exported', 'success')
        } catch (error: unknown) {
            handleCrudError({ error, resourceLabel: 'Payslips CSV export', showToast })
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
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                                {/* Print-only styles */}
                                <style>
                                    {`
                                        @media print {
                                            body * {
                                                visibility: hidden;
                                            }
                                            #payslip-content, #payslip-content * {
                                                visibility: visible;
                                            }
                                            #payslip-content {
                                                position: absolute;
                                                left: 0;
                                                top: 0;
                                                width: 100%;
                                            }
                                            .no-print {
                                                display: none !important;
                                            }
                                        }
                                    `}
                                </style>

                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block no-print">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div id="payslip-content" className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    {/* Header */}
                                    <div className="text-center border-b pb-6 mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
                                        <p className="text-sm text-gray-500">{companyAddress}</p>
                                        <h3 className="text-xl font-semibold mt-4 text-gray-800">PAYSLIP</h3>
                                        <p className="text-gray-600">Period: {payroll.payPeriod}</p>
                                    </div>

                                    {/* Employee Details */}
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <p className="text-sm text-gray-500">Employee Name</p>
                                            <p className="font-medium text-gray-900">{payroll.employee.firstName} {payroll.employee.lastName}</p>
                                            <p className="text-sm text-gray-500 mt-2">Employee ID</p>
                                            <p className="font-medium text-gray-900">{payroll.employee.employeeNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Department</p>
                                            <p className="font-medium text-gray-900">{payroll.employee.department?.name || 'N/A'}</p>
                                            <p className="text-sm text-gray-500 mt-2">Pay Date</p>
                                            <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Earnings & Deductions Table */}
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        {/* Earnings */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Earnings</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Basic Salary</span>
                                                    <span className="font-medium">{Number(payroll.baseSalary).toFixed(2)}</span>
                                                </div>
                                                {(Array.isArray(payroll.allowancesBreakdown) ? payroll.allowancesBreakdown : []).map((item: any, index: number) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span className="text-gray-600">{item.name}</span>
                                                        <span className="font-medium">{Number(item.amount).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between pt-2 border-t mt-2 font-semibold">
                                                    <span>Total Earnings</span>
                                                    <span>{(Number(payroll.baseSalary) + Number(payroll.allowances)).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Deductions</h4>
                                            <div className="space-y-2">
                                                {(Array.isArray(payroll.deductionsBreakdown) ? payroll.deductionsBreakdown : []).map((item: any, index: number) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span className="text-gray-600">{item.name}</span>
                                                        <span className="font-medium text-red-600">-{Number(item.amount).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between pt-2 border-t mt-2 font-semibold">
                                                    <span>Total Deductions</span>
                                                    <span className="text-red-600">-{Number(payroll.deductions).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Pay */}
                                    <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                                        <div>
                                            <p className="text-sm text-gray-500">Net Payable</p>
                                            <p className="text-xs text-gray-400">In words: {Number(payroll.netSalary).toFixed(2)} Only</p>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            ${Number(payroll.netSalary).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 no-print">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto"
                                        onClick={handleDownloadPdf}
                                    >
                                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                        Download PDF
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:w-auto"
                                        onClick={handleDownloadCsv}
                                    >
                                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                        Export CSV
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                                        onClick={handlePrint}
                                    >
                                        <PrinterIcon className="h-5 w-5 mr-2" />
                                        Print Payslip
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
