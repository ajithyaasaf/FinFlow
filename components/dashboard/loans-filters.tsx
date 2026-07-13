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
import { Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { AppUser } from '@/types'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface LoansFiltersProps {
    agents: { id: string; full_name: string; email?: string }[]
}

export function LoansFilters({ agents }: LoansFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [status, setStatus] = useState(searchParams.get('status') || 'all')
    const [agent, setAgent] = useState(searchParams.get('agent') || 'all')
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [from, setFrom] = useState(searchParams.get('from') || '')
    const [to, setTo] = useState(searchParams.get('to') || '')

    const applyFilters = () => {
        const params = new URLSearchParams()

        if (status && status !== 'all') params.set('status', status)
        if (agent && agent !== 'all') params.set('agent', agent)
        if (search) params.set('search', search)
        if (from) params.set('from', from)
        if (to) params.set('to', to)

        router.push(`/dashboard/loans?${params.toString()}`)
    }

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
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Application Submitted">Application Submitted</SelectItem>
                            <SelectItem value="Document Verification">Document Verification</SelectItem>
                            <SelectItem value="Credit Appraisal">Credit Appraisal</SelectItem>
                            <SelectItem value="Sanction">Sanction</SelectItem>
                            <SelectItem value="Agreement Signed">Agreement Signed</SelectItem>
                            <SelectItem value="Disbursement Ready">Disbursement Ready</SelectItem>
                            <SelectItem value="Disbursed">Disbursed</SelectItem>
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
                            onValueChange={setAgent}
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
                        onChange={(e) => setFrom(e.target.value)}
                    />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">To Date</label>
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by client name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        className="pl-10"
                    />
                </div>
                <Button onClick={applyFilters}>Apply Filters</Button>
                {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="gap-2">
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                )}
            </div>
        </div>
    )
}
