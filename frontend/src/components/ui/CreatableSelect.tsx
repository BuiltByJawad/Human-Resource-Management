import { useState, useRef, useEffect } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { useClickOutside } from '@/shared/hooks/useClickOutside'

interface Option {
    value: string
    label: string
}

interface CreatableSelectProps {
    label?: string
    value: string
    onChange: (value: string) => void
    options: Option[]
    disabled?: boolean
    className?: string
    placeholder?: string
    error?: string
    required?: boolean
}

export function CreatableSelect({
    label,
    value,
    onChange,
    options,
    disabled = false,
    className = '',
    placeholder = 'Select or type...',
    error,
    required = false
}: CreatableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false))

    // Initialize query with current value's label if it exists, otherwise value
    useEffect(() => {
        const option = (Array.isArray(options) ? options : []).find(opt => opt.value === value)
        if (option) {
            setQuery(option.label)
        } else if (value) {
            setQuery(value)
        }
    }, [value, options])

    const filteredOptions =
        query === ''
            ? options
            : (Array.isArray(options) ? options : []).filter((option) =>
                option.label.toLowerCase().includes(query.toLowerCase())
            )

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value
        setQuery(newVal)
        setIsOpen(true)
        // If the user types something that matches an option exactly, select it?
        // Or just let them type. For "creatable", we usually treat the input as the value if they blur?
        // But here we want to allow selecting existing options.
        // If we want to support "creating", we should probably update the value on blur or enter.
        // For now, let's just update the query.
    }

    const handleBlur = () => {
        // On blur, if the query doesn't match an option, we treat it as a new value
        // But we need to delay this because clicking an option triggers blur first.
        // useClickOutside handles closing, so we might not need strict blur handling for selection.
        // However, if user types "New" and clicks away, we want "New" to be the value.

        // Let's rely on the user explicitly selecting or pressing Enter.
        // Or we can update value on every change?
        // If we update value on every change, it might be annoying if it's a controlled component expecting valid IDs.
        // But for "Asset Type", it's just a string. So updating on change is fine.
        onChange(query)
    }

    return (
        <div className={className} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative mt-1">
                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 sm:text-sm">
                    <input
                        className={`w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none ${error ? 'text-red-900 placeholder-red-300' : ''}`}
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() => {
                            // Small delay to allow click event to fire
                            setTimeout(() => {
                                if (!isOpen) onChange(query)
                            }, 200)
                        }}
                        placeholder={placeholder}
                        disabled={disabled}
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                {isOpen && (
                    <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {filteredOptions.length === 0 && query !== '' ? (
                            <li
                                className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-600 hover:text-white"
                                onClick={() => handleSelect(query)}
                            >
                                <span className="block truncate font-normal">
                                    Create &quot;{query}&quot;
                                </span>
                            </li>
                        ) : (
                            filteredOptions.map((option) => (
                                <li
                                    key={option.value}
                                    className={`relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-600 hover:text-white`}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <span className={`block truncate ${value === option.value ? 'font-medium' : 'font-normal'}`}>
                                        {option.label}
                                    </span>
                                    {value === option.value ? (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 hover:text-white">
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                    ) : null}
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}
