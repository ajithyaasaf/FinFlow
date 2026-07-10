export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="h-4 w-64 bg-gray-200 rounded-lg" />
            </div>
            {/* Report filter bar */}
            <div className="flex gap-3 p-4 bg-white rounded-xl border">
                <div className="h-10 w-48 bg-gray-200 rounded-lg" />
                <div className="h-10 w-48 bg-gray-200 rounded-lg" />
                <div className="ml-auto h-10 w-32 bg-primary/20 rounded-lg" />
            </div>
            {/* Chart skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border p-6 h-64 space-y-3">
                        <div className="h-5 w-40 bg-gray-200 rounded" />
                        <div className="h-48 w-full bg-gray-100 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}
