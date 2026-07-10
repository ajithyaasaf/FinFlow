// Client detail page skeleton
export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse max-w-5xl">
            <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-56 bg-gray-200 rounded-lg" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile card */}
                <div className="bg-white rounded-xl border p-6 space-y-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
                    <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
                    <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex justify-between pt-2">
                            <div className="h-3 w-20 bg-gray-200 rounded" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>

                {/* Loan cards */}
                <div className="md:col-span-2 space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border p-5 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-5 w-40 bg-gray-200 rounded" />
                                <div className="h-6 w-24 bg-gray-200 rounded-full" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className="space-y-1">
                                        <div className="h-3 w-16 bg-gray-200 rounded" />
                                        <div className="h-5 w-20 bg-gray-200 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
