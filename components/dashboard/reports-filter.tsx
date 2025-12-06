'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Download, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function ReportsFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const [date, setDate] = useState<DateRange | undefined>(
        from && to ? { from: parseISO(from), to: parseISO(to) } : undefined
    )
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        if (date?.from && date?.to) {
            const params = new URLSearchParams(searchParams)
            params.set('from', date.from.toISOString())
            params.set('to', date.to.toISOString())
            router.push(`?${params.toString()}`)
        }
    }, [date, router, searchParams])

    const handleExport = async () => {
        setExporting(true)
        try {
            const params = new URLSearchParams()
            if (date?.from) params.set('from', date.from.toISOString())
            if (date?.to) params.set('to', date.to.toISOString())

            const response = await fetch(`/api/reports/export?${params.toString()}`)
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `finflow-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Report exported successfully')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export report')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="flex items-center gap-4 mb-6">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={handleExport} disabled={exporting}>
                {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                Export CSV
            </Button>
        </div>
    )
}
