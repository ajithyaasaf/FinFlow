import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-36 rounded-lg" />
                    <Skeleton className="h-4 w-52 rounded-md" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-1 min-w-[280px] bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-10 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3 w-40" />
                                    <div className="flex justify-between items-center pt-2">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
