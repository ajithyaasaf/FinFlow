export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 w-40 bg-gray-200 rounded-lg" />
                <div className="h-4 w-72 bg-gray-200 rounded-lg" />
            </div>

            {/* Search and filters */}
            <div className="flex gap-3 flex-wrap items-center bg-white/70 p-4 rounded-xl border">
                <div className="h-10 w-64 bg-gray-200 rounded-lg" />
                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg" />
                    ))}
                </div>
                <div className="ml-auto h-10 w-32 bg-primary/20 rounded-lg" />
            </div>

            {/* Article cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                        <div className="flex justify-between">
                            <div className="h-5 w-20 bg-gray-200 rounded-full" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                        <div className="h-6 w-48 bg-gray-200 rounded" />
                        <div className="space-y-1">
                            <div className="h-3 w-full bg-gray-200 rounded" />
                            <div className="h-3 w-5/6 bg-gray-200 rounded" />
                            <div className="h-3 w-4/6 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
