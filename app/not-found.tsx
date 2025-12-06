'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-md">
                <div className="p-4 bg-orange-100 rounded-full w-fit mx-auto mb-6">
                    <AlertCircle className="h-12 w-12 text-orange-600" />
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>

                <p className="text-gray-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button className="gap-2">
                            <Home className="h-4 w-4" />
                            Go Home
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={() => router.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}
