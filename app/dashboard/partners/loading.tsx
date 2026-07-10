export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 w-44 bg-gray-200 rounded-lg" />
                <div className="h-4 w-64 bg-gray-200 rounded-lg" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-6 px-6 py-4 border-b border-gray-50 last:border-0">
                        <div className="h-5 w-40 bg-gray-200 rounded" />
                        <div className="h-5 w-28 bg-gray-200 rounded" />
                        <div className="h-5 w-24 bg-gray-200 rounded" />
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
