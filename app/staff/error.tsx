'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function AgentError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Agent Portal Error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className="p-4 bg-red-100 rounded-full">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {error.message || "An unexpected error occurred. Please try again."}
                    </p>
                </div>
                <Button onClick={reset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            </div>
        </div>
    )
}
