import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * Root-level loading fallback for any routes without their own loading.tsx
 */
export default function Loading() {
    return <PageSkeleton variant="table" itemCount={6} />
}
