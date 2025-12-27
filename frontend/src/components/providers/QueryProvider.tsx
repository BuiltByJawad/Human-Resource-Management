'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

const isDev = process.env.NODE_ENV === 'development'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Aggressive caching to keep sidebar navigation instant like top HR dashboards
                staleTime: 10 * 60 * 1000, // 10 minutes
                gcTime: 15 * 60 * 1000, // retain caches to reuse across tabs/sections
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                refetchOnMount: false,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {isDev && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    )
}
