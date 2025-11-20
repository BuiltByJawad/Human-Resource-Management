'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AvatarUploadProps {
    currentAvatarUrl?: string | null
    onUpload: (file: File) => void
    onRemove?: () => void
    className?: string
}

export default function AvatarUpload({ currentAvatarUrl, onUpload, onRemove, className = '' }: AvatarUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            processFile(file)
        }
    }

    const processFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file')
            return
        }

        // Validate file size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should be less than 5MB')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
        onUpload(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
            processFile(file)
        }
    }

    const handleRemove = () => {
        setPreviewUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        if (onRemove) onRemove()
    }

    return (
        <div className={`flex items-center gap-6 ${className}`}>
            <div className="relative group">
                <div
                    className={`
            h-24 w-24 rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-50
            ${isDragging ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200'}
            transition-all duration-200
          `}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                        <PhotoIcon className="h-8 w-8 text-slate-300" />
                    )}

                    {/* Overlay on hover */}
                    <div
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="text-white text-xs font-medium">Change</span>
                    </div>
                </div>

                {previewUrl && (
                    <button
                        onClick={handleRemove}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-200 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                        title="Remove photo"
                    >
                        <XMarkIcon className="h-3 w-3" />
                    </button>
                )}
            </div>

            <div className="flex-1">
                <div
                    className={`
            border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}
          `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    )
}
