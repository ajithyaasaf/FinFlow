export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
            {/* Header */}
            <div className="space-y-2">
                <div className="h-7 w-48 bg-gray-200 rounded-md"></div>
                <div className="h-4 w-72 bg-gray-200 rounded-md"></div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="h-6 w-36 bg-gray-200 rounded-md"></div>
                    <div className="h-10 w-44 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="h-8 bg-gray-100 rounded-md w-full"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-50 rounded-md w-full"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}
