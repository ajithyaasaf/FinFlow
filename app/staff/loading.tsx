import { CardGridSkeleton } from '@/components/dashboard/card-grid-skeleton'

export default function StaffLoading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <CardGridSkeleton />
        </div>
    )
}
