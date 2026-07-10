export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-gray-200 rounded-md"></div>
                    <div className="h-4 w-72 bg-gray-200 rounded-md"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                </div>
            </div>

            {/* Filters */}
            <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="h-6 w-32 bg-gray-200 rounded-md"></div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="h-8 bg-gray-100 rounded-md w-full"></div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-50 rounded-md w-full"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}
