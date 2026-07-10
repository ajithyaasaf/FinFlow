import { Loader2 } from 'lucide-react'

export default function StaffLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        </div>
    )
}
