export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-40 bg-gray-200 rounded-md"></div>
                    <div className="h-4 w-60 bg-gray-200 rounded-md"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Grid of Agent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-32 bg-gray-200 rounded-md"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded-md"></div>
                            </div>
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="h-4 w-full bg-gray-100 rounded"></div>
                            <div className="h-4 w-full bg-gray-100 rounded"></div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
