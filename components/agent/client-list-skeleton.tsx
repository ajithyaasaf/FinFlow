'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ClientListSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3 flex-1">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex gap-2">
                                <Skeleton className="h-9 flex-1" />
                                <Skeleton className="h-9 w-9" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
