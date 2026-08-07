import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-52 rounded-md" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl" />
            </div>

            {/* Wiki Layout */}
            <div className="space-y-6">
                <Skeleton className="h-11 max-w-md w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-56 space-y-4 shadow-sm">
                            <Skeleton className="h-5 w-28" />
                            <div className="space-y-2 pt-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
