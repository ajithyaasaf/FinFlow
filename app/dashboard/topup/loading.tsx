export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 w-44 bg-gray-200 rounded-lg" />
                <div className="h-4 w-64 bg-gray-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border p-4 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-7 w-16 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex gap-6 px-6 py-4 border-b border-gray-50 last:border-0">
                        <div className="h-5 w-40 bg-gray-200 rounded" />
                        <div className="h-5 w-28 bg-gray-200 rounded" />
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                        <div className="ml-auto h-8 w-28 bg-gray-200 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}
