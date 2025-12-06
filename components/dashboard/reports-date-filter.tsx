'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from 'lucide-react'

export function ReportsDateFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const handleApply = (fromDate: string, toDate: string) => {
        const params = new URLSearchParams(searchParams)
        if (fromDate) params.set('from', fromDate)
        if (toDate) params.set('to', toDate)
        router.push(`/dashboard/reports?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    type="date"
                    defaultValue={from}
                    id="from-date"
                    className="w-auto"
                />
                <span className="text-sm text-gray-500">to</span>
                <Input
                    type="date"
                    defaultValue={to}
                    id="to-date"
                    className="w-auto"
                />
            </div>
            <Button
                size="sm"
                onClick={() => {
                    const fromEl = document.getElementById('from-date') as HTMLInputElement
                    const toEl = document.getElementById('to-date') as HTMLInputElement
                    handleApply(fromEl.value, toEl.value)
                }}
            >
                Apply
            </Button>
        </div>
    )
}
