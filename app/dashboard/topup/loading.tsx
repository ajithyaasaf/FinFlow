import { TableSkeleton } from '@/components/dashboard/table-skeleton'

export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <TableSkeleton rows={6} />
        </div>
    )
}
