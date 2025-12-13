import * as React from "react"

const badgeVariants = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    outline: "text-gray-900 border-gray-200",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof badgeVariants
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${badgeVariants[variant]} ${className}`}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
