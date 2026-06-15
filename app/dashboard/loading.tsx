export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
                <div className="h-4 w-64 bg-gray-200 rounded-md"></div>
            </div>

            {/* KPI Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            <div className="h-3 w-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-6 h-[400px] shadow-sm space-y-4">
                    <div className="h-6 w-40 bg-gray-200 rounded"></div>
                    <div className="h-4 w-72 bg-gray-200 rounded"></div>
                    <div className="space-y-3 pt-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                                <div className="space-y-1">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6 h-[400px] shadow-sm space-y-4">
                    <div className="h-6 w-36 bg-gray-200 rounded"></div>
                    <div className="h-4 w-56 bg-gray-200 rounded"></div>
                    <div className="space-y-4 pt-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-4 w-28 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
