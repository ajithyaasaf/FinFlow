export default function Loading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-36 bg-gray-200 rounded-md"></div>
                    <div className="h-4 w-52 bg-gray-200 rounded-md"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex-1 min-w-[280px] bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex flex-col space-y-4">
                        {/* Column Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="h-5 w-24 bg-gray-200 rounded"></div>
                            <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
                        </div>
                        {/* Column Cards */}
                        <div className="space-y-3 overflow-y-auto flex-1">
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="bg-white border border-gray-100 rounded-lg p-4 space-y-3 shadow-sm">
                                    <div className="flex justify-between">
                                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-10 bg-orange-100 rounded-full"></div>
                                    </div>
                                    <div className="h-3 w-40 bg-gray-100 rounded"></div>
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                                        <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
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
