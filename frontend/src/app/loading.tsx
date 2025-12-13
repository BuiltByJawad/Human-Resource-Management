'use client'

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {/* Animated Logo/Spinner */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 animate-pulse shadow-lg shadow-blue-500/30" />
                    <div className="absolute inset-0 w-16 h-16 rounded-2xl border-4 border-transparent border-t-white/50 animate-spin" />
                </div>

                {/* Loading Text */}
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-sm font-medium">Loading</span>
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                    </span>
                </div>
            </div>
        </div>
    )
}
