'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect, useTransition } from 'react'
import type { AppUser } from '@/types'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface LoansFiltersProps {
    agents: { id: string; full_name: string; email?: string }[]
}

export function LoansFilters({ agents }: LoansFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [status, setStatus] = useState(searchParams.get('status') || 'all')
    const [agent, setAgent] = useState(searchParams.get('agent') || 'all')
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [from, setFrom] = useState(searchParams.get('from') || '')
    const [to, setTo] = useState(searchParams.get('to') || '')

    const applyFilters = (newSearch = search, newStatus = status, newAgent = agent, newFrom = from, newTo = to) => {
        const params = new URLSearchParams()

        if (newStatus && newStatus !== 'all') params.set('status', newStatus)
        if (newAgent && newAgent !== 'all') params.set('agent', newAgent)
        if (newSearch.trim()) params.set('search', newSearch.trim())
        if (newFrom) params.set('from', newFrom)
        if (newTo) params.set('to', newTo)

        const queryString = params.toString()
        const targetUrl = queryString ? `/dashboard/loans?${queryString}` : '/dashboard/loans'
        startTransition(() => {
            router.replace(targetUrl, { scroll: false })
        })
    }

    // Debounced URL sync for search input (never overwrites local typing state)
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = searchParams.get('search') || ''
            if (search.trim() !== currentSearch) {
                applyFilters()
            }
        }, 400)

        return () => clearTimeout(timer)
    }, [search])

    const clearFilters = () => {
        setStatus('all')
        setAgent('all')
        setSearch('')
        setFrom('')
        setTo('')
        router.push('/dashboard/loans')
    }

    const hasActiveFilters =
        status !== 'all' ||
        agent !== 'all' ||
        search ||
        from ||
        to

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Select value={status} onValueChange={(val) => { setStatus(val); applyFilters(search, val, agent, from, to) }}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Login">Login</SelectItem>
                            <SelectItem value="PD Initiation">PD Initiation</SelectItem>
                            <SelectItem value="Technical Visit">Technical Visit</SelectItem>
                            <SelectItem value="Legal Verification">Legal Verification</SelectItem>
                            <SelectItem value="MOD">MOD</SelectItem>
                            <SelectItem value="Sanctioned">Sanctioned</SelectItem>
                            <SelectItem value="Disbursed">Disbursed</SelectItem>
                            <SelectItem value="Declined">Declined</SelectItem>
                            <SelectItem value="Relook">Relook</SelectItem>
                            <SelectItem value="Spill Over">Spill Over</SelectItem>
                            <SelectItem value="Documents Pending">Documents Pending</SelectItem>
                            <SelectItem value="Application Submitted">Application Submitted (Legacy)</SelectItem>
                            <SelectItem value="Document Verification">Document Verification (Legacy)</SelectItem>
                            <SelectItem value="Credit Appraisal">Credit Appraisal (Legacy)</SelectItem>
                            <SelectItem value="Sanction">Sanction (Legacy)</SelectItem>
                            <SelectItem value="Agreement Signed">Agreement Signed (Legacy)</SelectItem>
                            <SelectItem value="Disbursement Ready">Disbursement Ready (Legacy)</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Staff Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Staff</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Staff' },
                                ...agents.map((a) => ({
                                    value: a.id,
                                    label: a.email ? `${a.full_name} (${a.email})` : a.full_name,
                                    searchString: a.email ? `${a.full_name} ${a.email}` : a.full_name
                                }))
                            ]}
                            value={agent}
                            onValueChange={(val) => { setAgent(val); applyFilters(search, status, val, from, to) }}
                            placeholder="Select staff member"
                            searchPlaceholder="Search staff by name or email..."
                            className="h-10 rounded-xl"
                        />
                </div>

                {/* Date From */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">From Date</label>
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => { setFrom(e.target.value); applyFilters(search, status, agent, e.target.value, to) }}
                    />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">To Date</label>
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => { setTo(e.target.value); applyFilters(search, status, agent, from, e.target.value) }}
                    />
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    {isPending ? (
                        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                    ) : (
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                    <Input
                        placeholder="Search by client name, mobile, reference no, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`pl-10 ${isPending ? 'pr-32' : ''}`}
                    />
                    {isPending && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary animate-pulse flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            <Loader2 className="h-3 w-3 animate-spin" /> Fetching...
                        </span>
                    )}
                </div>
                {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="gap-2 shrink-0">
                        <X className="h-4 w-4" />
                        Clear Filters
                    </Button>
                )}
            </div>
        </div>
    )
}
