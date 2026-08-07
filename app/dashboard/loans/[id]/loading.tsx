import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="space-y-6 max-w-5xl">
            {/* Back link + title */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-8 w-64 rounded-lg" />
                <Skeleton className="h-4 w-48 rounded-lg" />
            </div>

            {/* Status + Actions bar */}
            <div className="flex gap-3 flex-wrap items-center">
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="ml-auto h-9 w-32 rounded-xl" />
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                        <Skeleton className="h-5 w-36" />
                        {Array.from({ length: 5 }).map((_, j) => (
                            <div key={j} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* EMI table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <Skeleton className="h-5 w-32" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-20 rounded-full ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    )
}
