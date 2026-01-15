'use client'

import { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState, useEffect } from 'react'

const isDev = process.env.NODE_ENV === 'development'

// Create persister only on client side
let persister: ReturnType<typeof createSyncStoragePersister> | undefined

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false)

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Aggressive caching to keep sidebar navigation instant like top HR dashboards
                staleTime: 10 * 60 * 1000, // 10 minutes
                gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache longer for persistence
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                refetchOnMount: false,
            },
        },
    }))

    useEffect(() => {
        // Initialize persister on client side only
        if (typeof window !== 'undefined' && !persister) {
            persister = createSyncStoragePersister({
                storage: window.localStorage,
                key: 'hrm-query-cache',
                // Throttle writes to reduce localStorage operations
                throttleTime: 1000,
            })
        }
        setIsClient(true)
    }, [])

    // During SSR or before hydration, use a non-persistent provider
    if (!isClient || !persister) {
        return (
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{
                    persister: {
                        persistClient: async () => { },
                        restoreClient: async () => undefined,
                        removeClient: async () => { },
                    },
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                }}
            >
                {children}
                {isDev && <ReactQueryDevtools initialIsOpen={false} />}
            </PersistQueryClientProvider>
        )
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                // Only persist successful queries
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        return query.state.status === 'success'
                    },
                },
            }}
        >
            {children}
            {isDev && <ReactQueryDevtools initialIsOpen={false} />}
        </PersistQueryClientProvider>
    )
}
