import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-4">
            {/* Filter & Search Bar Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pb-2">
                <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-28 rounded-xl" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
                {/* Table Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 px-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24 hidden md:block" />
                    <Skeleton className="h-4 w-28 hidden sm:block" />
                    <Skeleton className="h-4 w-20" />
                </div>

                {/* Table Rows */}
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-20 hidden md:block" />
                        <Skeleton className="h-4 w-24 hidden sm:block" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
