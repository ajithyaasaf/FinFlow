import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-8 w-56 rounded-lg" />
                <Skeleton className="h-4 w-40 rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                    <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                    <Skeleton className="h-5 w-32 rounded mx-auto" />
                    <Skeleton className="h-4 w-24 rounded mx-auto" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between pt-2 border-t border-gray-50">
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-3.5 w-24" />
                        </div>
                    ))}
                </div>

                {/* Loan cards */}
                <div className="md:col-span-2 space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-2">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="space-y-1.5">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
