// Loan list skeleton
export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 w-52 bg-gray-200 rounded-lg" />
                <div className="h-4 w-72 bg-gray-200 rounded-lg" />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="h-10 w-56 bg-gray-200 rounded-lg" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border p-4 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-7 w-16 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Loan Cards */}
            <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="h-5 w-40 bg-gray-200 rounded" />
                            <div className="h-3 w-28 bg-gray-200 rounded" />
                            <div className="h-3 w-36 bg-gray-200 rounded" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-24 bg-gray-200 rounded-full" />
                            <div className="h-8 w-28 bg-gray-200 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
