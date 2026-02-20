'use client'

import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { format, parseISO, isValid } from 'date-fns'
import { createPortal } from 'react-dom'

export interface DatePickerProps {
    label?: string
    value: string | Date | null
    onChange: (date: Date | null) => void
    error?: string
    required?: boolean
    placeholder?: string
    className?: string
    inputClassName?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    mode?: 'date' | 'month'
}

export function DatePicker({
    label,
    value,
    onChange,
    error,
    required,
    placeholder = 'Select date',
    className = '',
    inputClassName = '',
    minDate,
    maxDate,
    disabled,
    mode = 'date'
}: DatePickerProps) {
    // Handle string or Date input
    const selectedDate =
        typeof value === 'string' && value
            ? mode === 'month' && /^\d{4}-\d{2}$/.test(value)
                ? parseISO(`${value}-01`)
                : parseISO(value)
            : (value as Date)
    const baseInputClasses = `
            block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm
            ${error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
        }
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${inputClassName}
          `

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <ReactDatePicker
                    selected={isValid(selectedDate) ? selectedDate : null}
                    onChange={onChange}
                    className={baseInputClasses}
                    placeholderText={placeholder}
                    dateFormat={mode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy'}
                    minDate={minDate}
                    maxDate={maxDate}
                    disabled={disabled}
                    showPopperArrow={false}
                    showMonthDropdown={mode === 'month'}
                    showYearDropdown={mode === 'month'}
                    dropdownMode={mode === 'month' ? 'select' : undefined}
                    popperPlacement="bottom-start"
                    popperContainer={({ children }) =>
                        typeof document === 'undefined' ? <>{children}</> : createPortal(children, document.body)
                    }
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className={`h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                </div>
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <style jsx global>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          border-color: #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom-color: #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 0.75rem;
        }
        .react-datepicker__current-month {
          font-weight: 600;
          color: #111827;
        }
        .react-datepicker__day-name {
          color: #6b7280;
        }
        .react-datepicker__day {
          color: #374151;
          border-radius: 0.375rem;
        }
        .react-datepicker__day:hover {
          background-color: #eff6ff;
        }
        .react-datepicker__day--selected {
          background-color: #2563eb !important;
          color: #ffffff !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .react-datepicker__triangle {
          display: none;
        }
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
      `}</style>
        </div>
    )
}
