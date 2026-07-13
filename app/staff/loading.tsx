import { Skeleton } from '@/components/ui/skeleton'

export default function StaffLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 space-y-4">
            {/* Header Skeleton */}
            <div className="space-y-2 mt-4">
                <Skeleton className="h-7 w-1/3 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>

            {/* Content Cards Skeleton */}
            <div className="space-y-3 pt-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-airbnb-sm">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3 rounded-lg" />
                                <Skeleton className="h-3 w-1/4 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Skeleton className="h-3.5 w-full rounded-lg" />
                            <Skeleton className="h-3.5 w-5/6 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
