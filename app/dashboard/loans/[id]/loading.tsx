// Loan detail page skeleton
export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse max-w-5xl">
            {/* Back link + title */}
            <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-64 bg-gray-200 rounded-lg" />
                <div className="h-4 w-48 bg-gray-200 rounded-lg" />
            </div>

            {/* Status + Actions bar */}
            <div className="flex gap-3 flex-wrap">
                <div className="h-8 w-32 bg-gray-200 rounded-full" />
                <div className="h-8 w-28 bg-gray-200 rounded-full" />
                <div className="ml-auto h-9 w-32 bg-primary/20 rounded-lg" />
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border p-6 space-y-4">
                        <div className="h-5 w-36 bg-gray-200 rounded" />
                        {[...Array(5)].map((_, j) => (
                            <div key={j} className="flex justify-between">
                                <div className="h-4 w-28 bg-gray-200 rounded" />
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* EMI table */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 py-3 border-b border-gray-50">
                        <div className="h-4 w-8 bg-gray-200 rounded" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                        <div className="h-6 w-20 bg-gray-200 rounded-full ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    )
}
