'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 bg-red-100 rounded-full">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Something went wrong!</h2>
                    <p className="text-sm text-gray-500 max-w-md mt-1">
                        {error.message || "An unexpected error occurred while loading this page."}
                    </p>
                </div>
                <Button onClick={() => reset()}>Try again</Button>
            </div>
        </div>
    )
}
