// Kanban-column skeleton for Leads Hub
export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 w-36 bg-gray-200 rounded-lg" />
                <div className="h-4 w-80 bg-gray-200 rounded-lg" />
            </div>

            {/* Filter Bar */}
            <div className="flex gap-3">
                <div className="h-10 w-56 bg-gray-200 rounded-lg" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
                <div className="ml-auto h-10 w-28 bg-primary/20 rounded-lg" />
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {['New Lead', 'Contacted', 'Follow Up', 'Interested', 'Not Interested'].map((col) => (
                    <div key={col} className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                            <div className="h-5 w-6 bg-gray-200 rounded-full" />
                        </div>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-3 w-20 bg-gray-200 rounded" />
                                <div className="h-3 w-16 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
