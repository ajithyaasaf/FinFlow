// Generic table-style skeleton for Leads, Clients, Agents, Partners, Quotations pages
export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Page Header */}
            <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="h-4 w-72 bg-gray-200 rounded-lg" />
            </div>

            {/* Filter / Search Bar */}
            <div className="flex gap-3 items-center">
                <div className="h-10 w-64 bg-gray-200 rounded-lg" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
                <div className="ml-auto h-10 w-32 bg-primary/20 rounded-lg" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="flex gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
                    {[180, 120, 100, 120, 80].map((w, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: w }} />
                    ))}
                </div>

                {/* Table Rows */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50 last:border-0">
                        <div className="h-5 w-44 bg-gray-200 rounded" />
                        <div className="h-5 w-28 bg-gray-200 rounded" />
                        <div className="h-5 w-24 bg-gray-200 rounded" />
                        <div className="h-5 w-28 bg-gray-200 rounded" />
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
