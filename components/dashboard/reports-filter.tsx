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

    // Sync external search params changes (e.g. clearing) back to local state
    useEffect(() => {
        if (!from && !to) {
            setDate(undefined)
        } else if (from && to) {
            setDate({ from: parseISO(from), to: parseISO(to) })
        }
    }, [from, to])

    useEffect(() => {
        if (date?.from && date?.to) {
            const params = new URLSearchParams(searchParams)
            params.set('from', date.from.toISOString())
            params.set('to', date.to.toISOString())
            router.push(`?${params.toString()}`)
        }
    }, [date, router, searchParams])

    const handleClear = () => {
        setDate(undefined)
        const params = new URLSearchParams(searchParams)
        params.delete('from')
        params.delete('to')
        router.push(`?${params.toString()}`)
    }

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
        <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[280px] justify-start text-left font-normal rounded-full h-10 border-gray-200",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-[#6a6a6a]" />
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
                    <PopoverContent className="w-auto p-0 flex flex-col overflow-hidden rounded-2xl border border-gray-150 shadow-airbnb-lg" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        {date && (
                            <div className="p-3 border-t border-gray-100 flex justify-end bg-[#f7f7f7]/50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClear}
                                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full px-4 h-8 font-semibold"
                                >
                                    Clear Filter
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>

                {date && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-10 w-10 rounded-full border border-gray-200 text-[#6a6a6a] hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/50 flex-shrink-0 transition-colors"
                        title="Clear Date Filter"
                    >
                        <span className="font-bold text-sm">✕</span>
                    </Button>
                )}
            </div>

            <Button variant="outline" onClick={handleExport} disabled={exporting} className="rounded-full h-10 border-gray-200">
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
