export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-32 bg-gray-200 rounded-md"></div>
                    <div className="h-4 w-52 bg-gray-200 rounded-md"></div>
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Wiki Layout (Search bar + categories) */}
            <div className="space-y-6">
                <div className="h-11 bg-white border border-gray-100 rounded-xl max-w-md w-full shadow-sm"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 h-56 space-y-4 shadow-sm">
                            <div className="h-5 w-28 bg-gray-200 rounded"></div>
                            <div className="space-y-2 pt-2">
                                <div className="h-4 w-full bg-gray-100 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
