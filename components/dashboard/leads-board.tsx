'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Flame, LayoutGrid, List, User, Plus, Phone, Calendar, ClipboardCheck, ArrowUpRight, Loader2, Info } from 'lucide-react'
import type { Lead, LeadStatus, LeadHeatLevel, LeadSource, Activity } from '@/types'
import { updateLeadStatusAction, promoteLeadToClientAction, getLeadDetailsAction } from '@/app/actions/leads'
import { createActivityAction, updateActivityStatusAction } from '@/app/actions/activities'
import { CreateLeadModal } from './create-lead-modal'

interface LeadsBoardProps {
    initialLeads: Lead[]
    agents: { id: string; full_name: string }[]
}

const STATUS_COLUMNS: { key: LeadStatus; label: string; color: string }[] = [
    { key: 'NEW', label: 'New Lead', color: 'border-t-blue-500' },
    { key: 'CONTACTED', label: 'Contacted', color: 'border-t-yellow-500' },
    { key: 'FOLLOW_UP', label: 'Follow Up', color: 'border-t-orange-500' },
    { key: 'INTERESTED', label: 'Interested', color: 'border-t-green-500' },
    { key: 'NOT_INTERESTED', label: 'Not Interested', color: 'border-t-red-500' }
]

const HEAT_COLORS: Record<LeadHeatLevel, string> = {
    HOT: 'bg-rose-500 text-white',
    WARM: 'bg-amber-500 text-white',
    COLD: 'bg-slate-500 text-white'
}

export function LeadsBoard({ initialLeads, agents }: LeadsBoardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [leads, setLeads] = useState<Lead[]>(initialLeads)
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
    const [searchTerm, setSearchTerm] = useState('')
    const [heatFilter, setHeatFilter] = useState<string>('ALL')
    const [sourceFilter, setSourceFilter] = useState<string>('ALL')
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])
    const [loadingActivities, setLoadingActivities] = useState(false)
    const [activityFormOpen, setActivityFormOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Activity form states
    const [activityType, setActivityType] = useState<'CALL_LOG' | 'TASK' | 'REMINDER'>('CALL_LOG')
    const [activityTitle, setActivityTitle] = useState('')
    const [activityDesc, setActivityDesc] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        setLeads(initialLeads)
    }, [initialLeads])

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone_number.includes(searchTerm) ||
            (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesHeat = heatFilter === 'ALL' || lead.heat_level === heatFilter
        const matchesSource = sourceFilter === 'ALL' || lead.source === sourceFilter

        return matchesSearch && matchesHeat && matchesSource
    })

    // Kanban Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData('text/plain', leadId)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleUpdateLeadStatus = async (leadId: string, targetStatus: LeadStatus) => {
        // Find the lead
        const lead = leads.find(l => l.lead_id === leadId)
        if (!lead || lead.status === targetStatus) return

        // Optimistically update UI
        const previousLeads = [...leads]
        const updatedLeads = leads.map(l => l.lead_id === leadId ? { ...l, status: targetStatus } : l)
        setLeads(updatedLeads)

        // Also update the selectedLead in modal state if it's currently open
        if (selectedLead && selectedLead.lead_id === leadId) {
            setSelectedLead({ ...selectedLead, status: targetStatus })
        }

        // Trigger action
        const result = await updateLeadStatusAction(leadId, targetStatus)
        if (!result.success) {
            toast.error(result.error || 'Failed to update lead status')
            setLeads(previousLeads) // Rollback
            if (selectedLead && selectedLead.lead_id === leadId) {
                setSelectedLead(lead) // Rollback
            }
        } else {
            toast.success(`Updated status of ${lead.full_name} to ${targetStatus}`)
        }
    }

    const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
        e.preventDefault()
        const leadId = e.dataTransfer.getData('text/plain')
        if (!leadId) return
        await handleUpdateLeadStatus(leadId, targetStatus)
    }

    // Convert Lead to Client Action
    const handlePromoteLead = async (leadId: string) => {
        setActionLoading(true)
        try {
            const result = await promoteLeadToClientAction(leadId)
            if (result.success) {
                toast.success('Lead converted to client profile successfully!')
                setSelectedLead(null)
                router.push(`/dashboard/clients/${result.clientId}`)
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to convert lead')
        } finally {
            setActionLoading(false)
        }
    }

    const handleSelectLead = async (lead: Lead) => {
        setSelectedLead(lead)
        setActivities([])
        setLoadingActivities(true)
        try {
            const res = await getLeadDetailsAction(lead.lead_id)
            if (res.success && res.details) {
                setActivities(res.details.activities)
            }
        } catch (err) {
            console.error('Error fetching activities:', err)
        } finally {
            setLoadingActivities(false)
        }
    }

    // Submit log / reminder activity
    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedLead || !activityTitle.trim()) return

        setActionLoading(true)
        try {
            const result = await createActivityAction({
                title: activityTitle,
                description: activityDesc,
                type: activityType,
                status: 'PENDING',
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                related_lead_id: selectedLead.lead_id,
                assigned_agent_id: selectedLead.assigned_agent_id
            } as any)

            if (result.success && result.activity) {
                toast.success(`${activityType === 'CALL_LOG' ? 'Call logged' : 'Task added'} successfully!`)
                setActivityFormOpen(false)
                setActivityTitle('')
                setActivityDesc('')
                setDueDate('')
                setActivities(prev => [result.activity as Activity, ...prev])
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to add activity')
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdateActivityStatus = async (activityId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
        try {
            const result = await updateActivityStatusAction(activityId, status)
            if (result.success) {
                toast.success(`Activity marked as ${status.toLowerCase()}!`)
                setActivities(prev => prev.map(act => act.activity_id === activityId ? { ...act, status } : act))
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update activity status')
        }
    }

    // Auto-open lead details if leadId query param is present
    useEffect(() => {
        const leadId = searchParams.get('leadId')
        if (leadId) {
            const lead = leads.find(l => l.lead_id === leadId)
            if (lead) {
                handleSelectLead(lead)
            }
        }
    }, [searchParams, leads])

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur p-4 rounded-xl border">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative w-full max-w-[300px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>

                    <Select value={heatFilter} onValueChange={setHeatFilter}>
                        <SelectTrigger className="w-[140px] bg-white">
                            <SelectValue placeholder="Heat Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Heat Levels</SelectItem>
                            <SelectItem value="HOT">Hot 🔥</SelectItem>
                            <SelectItem value="WARM">Warm ☀️</SelectItem>
                            <SelectItem value="COLD">Cold ❄️</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-[160px] bg-white">
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Sources</SelectItem>
                            <SelectItem value="DIGITAL_MARKETING">Digital Marketing</SelectItem>
                            <SelectItem value="COLD_CALLING">Cold Calling</SelectItem>
                            <SelectItem value="REFERRAL">Referral</SelectItem>
                            <SelectItem value="WALK_IN">Walk In</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3 justify-end">
                    <div className="flex border rounded-lg overflow-hidden bg-white p-0.5">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded transition-all ${
                                viewMode === 'kanban'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            title="Kanban Board"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded transition-all ${
                                viewMode === 'list'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            title="Table List"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <Button onClick={() => setCreateModalOpen(true)} className="gap-2 text-sm">
                        <Plus className="h-4 w-4" />
                        Add Lead
                    </Button>
                </div>
            </div>

            {/* Kanban view */}
            {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
                    {STATUS_COLUMNS.map((column) => {
                        const columnLeads = filteredLeads.filter(l => l.status === column.key)
                        return (
                            <div
                                key={column.key}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.key)}
                                className={`flex flex-col min-w-[220px] bg-gray-50/80 backdrop-blur rounded-xl p-3 border border-gray-200 border-t-4 ${column.color} min-h-[500px]`}
                            >
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="font-semibold text-sm text-gray-700">{column.label}</span>
                                    <Badge variant="outline" className="bg-white">
                                        {columnLeads.length}
                                    </Badge>
                                </div>

                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                                    {columnLeads.map((lead) => (
                                        <div
                                            key={lead.lead_id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead.lead_id)}
                                            onClick={() => handleSelectLead(lead)}
                                            className="bg-white rounded-lg p-3 border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition duration-150 border-l-4 border-l-gray-300 relative group"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge className={`text-[10px] scale-90 -ml-1 ${HEAT_COLORS[lead.heat_level]}`}>
                                                    {lead.heat_level}
                                                </Badge>
                                                <span className="text-[10px] text-gray-400 capitalize">{lead.source.replace('_', ' ').toLowerCase()}</span>
                                            </div>
                                            <h4 className="font-semibold text-sm text-gray-800 group-hover:text-primary transition">{lead.full_name}</h4>
                                            {lead.company_name && (
                                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{lead.company_name}</p>
                                            )}
                                            <div className="flex items-center justify-between mt-3 text-[11px] text-gray-500 border-t pt-2">
                                                <span className="flex items-center gap-1 font-mono">
                                                    <Phone className="h-3 w-3" />
                                                    {lead.phone_number}
                                                </span>
                                                {lead.assigned_agent_id && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        Staff
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {columnLeads.length === 0 && (
                                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-xs text-gray-400">
                                            Drag leads here
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* List view */
                <Card className="border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="w-[180px]">Client Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Heat Level</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.map((lead) => (
                                <TableRow
                                    key={lead.lead_id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleSelectLead(lead)}
                                >
                                    <TableCell className="font-semibold">{lead.full_name}</TableCell>
                                    <TableCell className="font-mono text-xs">{lead.phone_number}</TableCell>
                                    <TableCell className="text-gray-500 text-xs truncate max-w-[150px]">{lead.company_name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize text-xs font-semibold">
                                            {lead.status.replace('_', ' ').toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-400 capitalize">{lead.source.replace('_', ' ').toLowerCase()}</TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs font-bold ${HEAT_COLORS[lead.heat_level]}`}>
                                            {lead.heat_level}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePromoteLead(lead.lead_id)}
                                            disabled={actionLoading}
                                            className="text-xs gap-1.5 h-8 font-semibold text-primary hover:text-primary-dark"
                                        >
                                            Promote
                                            <ArrowUpRight className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredLeads.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-gray-500 py-12 text-sm">
                                        No leads found matching current filter criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Create lead Modal */}
            <CreateLeadModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                agents={agents}
            />

            {/* Lead detail Drawer / Dialog */}
            <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
                <DialogContent className="sm:max-w-[550px]">
                    {selectedLead && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                    {selectedLead.full_name}
                                    <Badge className={HEAT_COLORS[selectedLead.heat_level]}>
                                        {selectedLead.heat_level}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="font-mono text-xs flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                    <span>Lead ID: {selectedLead.lead_id}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-sans flex items-center gap-1 text-[11px] text-gray-500">
                                        Status:
                                        <select
                                            value={selectedLead.status}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value as LeadStatus
                                                await handleUpdateLeadStatus(selectedLead.lead_id, newStatus)
                                            }}
                                            className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border outline-none cursor-pointer transition ${
                                                selectedLead.status === 'NEW'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : selectedLead.status === 'CONTACTED'
                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    : selectedLead.status === 'FOLLOW_UP'
                                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                    : selectedLead.status === 'INTERESTED'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                            }`}
                                        >
                                            <option value="NEW" className="bg-white text-gray-700">New</option>
                                            <option value="CONTACTED" className="bg-white text-gray-700">Contacted</option>
                                            <option value="FOLLOW_UP" className="bg-white text-gray-700">Follow Up</option>
                                            <option value="INTERESTED" className="bg-white text-gray-700">Interested</option>
                                            <option value="NOT_INTERESTED" className="bg-white text-gray-700">Not Interested</option>
                                        </select>
                                    </span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y text-sm">
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Phone Number</span>
                                    <span className="font-mono font-semibold">{selectedLead.phone_number}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Email Address</span>
                                    <span>{selectedLead.email || 'Not provided'}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Company Name</span>
                                    <span>{selectedLead.company_name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Source</span>
                                    <span className="capitalize">{selectedLead.source.replace('_', ' ').toLowerCase()}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Assigned Staff</span>
                                    <span className="font-semibold text-gray-700">{selectedLead.assigned_agent?.full_name || 'Unassigned'}</span>
                                </div>
                                {selectedLead.constitution && (
                                    <div>
                                        <span className="text-xs text-gray-400 block font-medium">Constitution</span>
                                        <span>{selectedLead.constitution}</span>
                                    </div>
                                )}
                                {selectedLead.nature_of_business && (
                                    <div>
                                        <span className="text-xs text-gray-400 block font-medium">Business Detail</span>
                                        <span>{selectedLead.nature_of_business}</span>
                                    </div>
                                )}
                                {selectedLead.address && (
                                    <div className="col-span-2">
                                        <span className="text-xs text-gray-400 block font-medium">Address</span>
                                        <span>{selectedLead.address}, {selectedLead.city}, {selectedLead.state} - {selectedLead.zip_code}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions block */}
                            <div className="flex gap-3 justify-between items-center py-2">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setActivityType('CALL_LOG')
                                            setActivityFormOpen(true)
                                        }}
                                        className="gap-1.5 text-xs h-9"
                                    >
                                        <Phone className="h-3.5 w-3.5" />
                                        Log Call
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setActivityType('REMINDER')
                                            setActivityFormOpen(true)
                                        }}
                                        className="gap-1.5 text-xs h-9"
                                    >
                                        <Calendar className="h-3.5 w-3.5" />
                                        Set Callback
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => handlePromoteLead(selectedLead.lead_id)}
                                    disabled={actionLoading}
                                    className="gap-1.5 text-xs h-9 px-4 font-semibold"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                    )}
                                    Promote to Client
                                </Button>
                            </div>

                            {/* Activity Form */}
                            {activityFormOpen && (
                                <form onSubmit={handleCreateActivity} className="bg-gray-50 rounded-lg p-4 border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h4 className="text-xs font-bold text-gray-700 capitalize flex items-center gap-1.5">
                                            {activityType === 'CALL_LOG' ? <Phone className="h-3.5 w-3.5 text-primary" /> : <Calendar className="h-3.5 w-3.5 text-primary" />}
                                            {activityType.replace('_', ' ').toLowerCase()} Details
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setActivityFormOpen(false)}
                                            className="text-xs text-gray-400 hover:text-gray-600"
                                        >
                                            Dismiss
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="act_title" className="text-xs">Title / Subject *</Label>
                                            <Input
                                                id="act_title"
                                                placeholder={activityType === 'CALL_LOG' ? 'e.g. Call outcome: Interested' : 'e.g. Visit site to collect files'}
                                                value={activityTitle}
                                                onChange={(e) => setActivityTitle(e.target.value)}
                                                className="h-8 text-xs bg-white"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="act_desc" className="text-xs">Notes / Details</Label>
                                            <Textarea
                                                id="act_desc"
                                                placeholder="Enter conversation notes or details"
                                                value={activityDesc}
                                                onChange={(e) => setActivityDesc(e.target.value)}
                                                rows={2}
                                                className="text-xs bg-white"
                                            />
                                        </div>

                                        {activityType === 'REMINDER' && (
                                            <div className="space-y-1">
                                                <Label htmlFor="act_due" className="text-xs">Reminder Time *</Label>
                                                <Input
                                                    id="act_due"
                                                    type="datetime-local"
                                                    value={dueDate}
                                                    onChange={(e) => setDueDate(e.target.value)}
                                                    className="h-8 text-xs bg-white"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setActivityFormOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" size="sm" className="h-7 text-xs" disabled={actionLoading}>
                                            Save Log
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {/* Activity History Timeline */}
                            <div className="mt-4 border-t pt-4">
                                <h3 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                                    <ClipboardCheck className="h-4 w-4 text-primary" />
                                    Activity & Callback History
                                </h3>

                                {loadingActivities ? (
                                    <div className="flex items-center justify-center py-6 text-gray-500 text-xs gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span>Loading logs...</span>
                                    </div>
                                ) : activities.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg border border-dashed">
                                        No calls or reminders logged for this lead yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                        {activities.map((act) => (
                                            <div key={act.activity_id} className="text-xs border rounded-lg p-2.5 bg-gray-50/50 flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                                                        {act.type === 'CALL_LOG' ? (
                                                            <Phone className="h-3.5 w-3.5 text-blue-500" />
                                                        ) : act.type === 'REMINDER' ? (
                                                            <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                                        ) : (
                                                            <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                                                        )}
                                                        {act.title}
                                                    </span>
                                                    <select
                                                        value={act.status}
                                                        onChange={(e) => {
                                                            e.stopPropagation()
                                                            handleUpdateActivityStatus(act.activity_id, e.target.value as any)
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`text-[10px] scale-90 font-semibold rounded px-1.5 py-0.5 border outline-none cursor-pointer transition ${
                                                            act.status === 'COMPLETED' 
                                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                                : act.status === 'CANCELLED'
                                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}
                                                    >
                                                        <option value="PENDING" className="bg-white text-gray-700">Pending</option>
                                                        <option value="COMPLETED" className="bg-white text-gray-700">Completed</option>
                                                        <option value="CANCELLED" className="bg-white text-gray-700">Cancelled</option>
                                                    </select>
                                                </div>
                                                {act.description && (
                                                    <p className="text-gray-600 pl-5 text-[11px] leading-relaxed">{act.description}</p>
                                                )}
                                                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 border-t pt-1.5 pl-5">
                                                    <span>
                                                        Logged: {new Date(act.created_at).toLocaleString()}
                                                        {act.assigned_agent?.full_name && ` by ${act.assigned_agent.full_name}`}
                                                    </span>
                                                    {act.due_date && (
                                                        <span className="font-semibold text-amber-600">
                                                            Due: {new Date(act.due_date).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedLead(null)}
                                >
                                    Close Details
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
