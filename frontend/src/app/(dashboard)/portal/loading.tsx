import PageSkeleton from '@/components/ui/PageSkeleton'
import { PageSkeletonGate } from '@/components/ui/PageSkeletonGate'

export default function Loading() {
    return (
        <PageSkeletonGate>
            <PageSkeleton />
        </PageSkeletonGate>
    )
}
