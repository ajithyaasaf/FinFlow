import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40 rounded-lg" />
                    <Skeleton className="h-4 w-60 rounded-md" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Grid of Agent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="space-y-2.5 pt-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
