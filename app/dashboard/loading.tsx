import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-gray-500 font-sans">Loading data...</p>
        </div>
    )
}
