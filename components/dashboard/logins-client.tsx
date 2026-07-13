'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    ChevronLeft, ChevronRight, Eye, Search, X, MapPin, Building2, User,
    TrendingUp, IndianRupee, Filter, RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { LOGINS_STAGES, STAGE_COLORS, REGIONS, type LoginWithRelations, type LoginsStats } from '@/lib/services/loginsConstants'

// ─────────────────────────────────────────────
// Metric card
// ─────────────────────────────────────────────
function MetricCard({ label, count, colorClass, onClick, active }: {
    label: string
    count: number
    colorClass: string
    onClick: () => void
    active: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={`
                text-left p-3 rounded-xl border transition-all duration-150 hover:shadow-md group
                ${active
                    ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary/40'
                }
            `}
        >
            <p className={`text-2xl font-bold ${active ? 'text-primary' : 'text-gray-900'}`}>{count}</p>
            <p className={`text-xs font-medium mt-0.5 ${colorClass}`}>{label}</p>
        </button>
    )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
interface LoginsClientProps {
    logins: LoginWithRelations[]
    stats: LoginsStats
    total: number
    currentPage: number
    totalPages: number
    agents: { id: string; full_name: string; email: string }[]
    partners: { partner_id: string; bank_name: string; branch_name: string | null }[]
}

export function LoginsClient({
    logins, stats, total, currentPage, totalPages, agents, partners
}: LoginsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [stage, setStage] = useState(searchParams.get('stage') || 'all')
    const [region, setRegion] = useState(searchParams.get('region') || 'all')
    const [bank, setBank] = useState(searchParams.get('bank') || 'all')
    const [agent, setAgent] = useState(searchParams.get('agent') || 'all')
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [from, setFrom] = useState(searchParams.get('from') || '')
    const [to, setTo] = useState(searchParams.get('to') || '')

    const push = (extra?: Record<string, string>) => {
        const p = new URLSearchParams()
        const vals = { stage, region, bank, agent, search, from, to, ...extra }
        Object.entries(vals).forEach(([k, v]) => { if (v && v !== 'all') p.set(k, v) })
        startTransition(() => router.push(`/dashboard/logins?${p.toString()}`))
    }

    const clear = () => {
        setStage('all'); setRegion('all'); setBank('all')
        setAgent('all'); setSearch(''); setFrom(''); setTo('')
        startTransition(() => router.push('/dashboard/logins'))
    }

    const navigatePage = (pg: number) => push({ page: String(pg) })

    const hasFilters = stage !== 'all' || region !== 'all' || bank !== 'all'
        || agent !== 'all' || search || from || to

    // Stage metric card click
    const handleStageClick = (s: string) => {
        const next = stage === s ? 'all' : s
        setStage(next)
        const p = new URLSearchParams()
        const vals = { stage: next, region, bank, agent, search, from, to }
        Object.entries(vals).forEach(([k, v]) => { if (v && v !== 'all') p.set(k, v) })
        startTransition(() => router.push(`/dashboard/logins?${p.toString()}`))
    }

    return (
        <div className="space-y-6">

            {/* ── Stage metric grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {LOGINS_STAGES.map((s) => (
                    <MetricCard
                        key={s}
                        label={s}
                        count={stats.stageCounts[s] || 0}
                        colorClass={STAGE_COLORS[s]?.split(' ')[1] || 'text-gray-700'}
                        onClick={() => handleStageClick(s)}
                        active={stage === s}
                    />
                ))}
            </div>

            {/* ── Financial summary ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <IndianRupee className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                        <p className="text-xs text-green-700 font-medium">Total Disbursed</p>
                        <p className="text-lg font-bold text-green-900">{formatCurrency(stats.totalDisbursedAmount)}</p>
                        <p className="text-[10px] text-green-600">
                            New: {stats.totalDisbursedNew} · Repeat: {stats.totalDisbursedRepeat} · Spill: {stats.totalSpillOver}
                        </p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-5 w-5 text-teal-700" />
                    </div>
                    <div>
                        <p className="text-xs text-teal-700 font-medium">Total Sanctioned</p>
                        <p className="text-lg font-bold text-teal-900">{formatCurrency(stats.totalSanctionedAmount)}</p>
                        <p className="text-[10px] text-teal-600">{stats.stageCounts['Sanctioned'] || 0} files sanctioned</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-primary font-medium">Total Logins</p>
                        <p className="text-lg font-bold text-gray-900">{total}</p>
                        <p className="text-[10px] text-primary/80">Across all stages</p>
                    </div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filter Logins
                    </p>
                    {hasFilters && (
                        <Button size="sm" variant="ghost" onClick={clear} className="text-red-500 gap-1">
                            <X className="h-3 w-3" /> Clear
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    {/* Stage */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Stage</label>
                        <Select value={stage} onValueChange={setStage}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="All Stages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                {LOGINS_STAGES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Region */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Region</label>
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="All Regions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Regions</SelectItem>
                                {REGIONS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Bank */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Bank / NBFC</label>
                        <Select value={bank} onValueChange={setBank}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="All Banks" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Banks</SelectItem>
                                {partners.map((p) => (
                                    <SelectItem key={p.partner_id} value={p.partner_id}>
                                        {p.bank_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Agent */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Staff</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Staff' },
                                ...agents.map((a) => ({
                                    value: a.id,
                                    label: a.full_name,
                                    searchString: `${a.full_name} ${a.email}`,
                                })),
                            ]}
                            value={agent}
                            onValueChange={setAgent}
                            placeholder="All Staff"
                            searchPlaceholder="Search staff..."
                            className="h-9 text-xs"
                        />
                    </div>
                    {/* Date from */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">From</label>
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-xs" />
                    </div>
                    {/* Date to */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">To</label>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-xs" />
                    </div>
                </div>
                {/* Search + apply */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search by client name, reference no, or product..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && push()}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    <Button onClick={() => push()} size="sm" disabled={isPending} className="gap-1.5">
                        {isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                        Apply
                    </Button>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {logins.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No login files found</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-xs">Logins #</TableHead>
                                    <TableHead className="text-xs">Logged By</TableHead>
                                    <TableHead className="text-xs">Client</TableHead>
                                    <TableHead className="text-xs">Bank / NBFC</TableHead>
                                    <TableHead className="text-xs">Product</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs text-right">Amount</TableHead>
                                    <TableHead className="text-xs">Region</TableHead>
                                    <TableHead className="text-xs">TL</TableHead>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logins.map((login) => (
                                    <LoginsRow key={login.loan_id} login={login} router={router} />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <p>Page {currentPage} of {totalPages} · {total} records</p>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigatePage(currentPage - 1)} disabled={currentPage === 1 || isPending}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigatePage(currentPage + 1)} disabled={currentPage === totalPages || isPending}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Single table row
// ─────────────────────────────────────────────
function LoginsRow({ login, router }: { login: LoginWithRelations; router: ReturnType<typeof useRouter> }) {
    const stageColor = STAGE_COLORS[login.process_stage] || 'bg-gray-100 text-gray-700 border-gray-200'
    const refNo = login.login_reference_number || login.loan_id.slice(0, 8).toUpperCase()

    return (
        <TableRow className="hover:bg-gray-50/50 transition-colors">
            <TableCell className="font-mono text-xs text-primary font-semibold">{refNo}</TableCell>
            <TableCell className="text-xs">
                <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-gray-400 shrink-0" />
                    {login.onboarding_agent?.full_name || '—'}
                </div>
            </TableCell>
            <TableCell>
                <div>
                    <p className="text-xs font-medium text-gray-900">{login.client?.full_name || '—'}</p>
                    <p className="text-[10px] text-gray-400">{login.client?.mobile_number || ''}</p>
                </div>
            </TableCell>
            <TableCell className="text-xs">
                {login.bank_partner ? (
                    <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                        <span>{login.bank_partner.bank_name}</span>
                    </div>
                ) : <span className="text-gray-400">In-house</span>}
            </TableCell>
            <TableCell className="text-xs text-gray-600">{login.product_name || '—'}</TableCell>
            <TableCell>
                <Badge className={`text-[10px] px-2 py-0.5 font-medium border ${stageColor}`}>
                    {login.process_stage}
                </Badge>
            </TableCell>
            <TableCell className="text-right text-xs font-semibold text-gray-900">
                {formatCurrency(login.amount)}
            </TableCell>
            <TableCell className="text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {login.region || '—'}
                </div>
            </TableCell>
            <TableCell className="text-xs text-gray-600">{login.assigned_tl?.full_name || '—'}</TableCell>
            <TableCell className="text-xs text-gray-500">
                {new Date(login.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
            </TableCell>
            <TableCell className="text-right">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => router.push(`/dashboard/loans/${login.loan_id}`)}
                >
                    <Eye className="h-3.5 w-3.5" />
                    View
                </Button>
            </TableCell>
        </TableRow>
    )
}
