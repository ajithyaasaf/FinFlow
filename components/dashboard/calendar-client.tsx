'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Check,
    Clock,
    User,
    Phone,
    ClipboardCheck,
    Info,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Sparkles,
    Filter,
} from 'lucide-react'
import type { Activity, ActivityType, ActivityStatus } from '@/types'
import { createActivityAction, updateActivityStatusAction } from '@/app/actions/activities'

function formatDateKey(dateInput: Date | string | null): string {
    if (!dateInput) return ''
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function formatDayLabel(dateInput: Date | string | null): string {
    if (!dateInput) return ''
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

interface CalendarClientProps {
    initialActivities: Activity[]
    currentUser: { id: string; full_name: string; email: string }
    userRole: string
    staffMembers: { id: string; full_name: string; email: string }[]
}

export function CalendarClient({
    initialActivities,
    currentUser,
    userRole,
    staffMembers,
}: CalendarClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isPending, startTransition] = useTransition()

    // Activities state
    const [activities, setActivities] = useState<Activity[]>(initialActivities)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

    // Filter states
    const [filterTypes, setFilterTypes] = useState<ActivityType[]>(['REMINDER', 'TASK', 'CALL_LOG'])
    const [filterStatuses, setFilterStatuses] = useState<ActivityStatus[]>(['PENDING', 'COMPLETED'])
    const [selectedAgentId, setSelectedAgentId] = useState<string>(
        userRole === 'STAFF' || userRole === 'AGENT' ? currentUser.id : 'all'
    )

    // Quick Task Form states
    const [newTitle, setNewTitle] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [newType, setNewType] = useState<ActivityType>('REMINDER')
    const [newAgentId, setNewAgentId] = useState(currentUser.id)
    const [newLeadId, setNewLeadId] = useState<string>('none')
    const [newClientId, setNewClientId] = useState<string>('none')

    // Searchable relations lists
    const [leadsList, setLeadsList] = useState<{ id: string; name: string }[]>([])
    const [clientsList, setClientsList] = useState<{ id: string; name: string }[]>([])

    // Fetch related lists on mount
    useEffect(() => {
        async function fetchRelations() {
            try {
                const [leadsRes, clientsRes] = await Promise.all([
                    supabase.from('leads').select('lead_id, full_name').order('full_name'),
                    supabase.from('clients').select('client_id, full_name').order('full_name'),
                ])

                if (leadsRes.data) {
                    setLeadsList(leadsRes.data.map(l => ({ id: l.lead_id, name: l.full_name })))
                }
                if (clientsRes.data) {
                    setClientsList(clientsRes.data.map(c => ({ id: c.client_id, name: c.full_name })))
                }
            } catch (err) {
                console.error('Error fetching relations for calendar form:', err)
            }
        }
        fetchRelations()
    }, [supabase])

    // Load/sync latest activities periodically or when database revalidates
    useEffect(() => {
        setActivities(initialActivities)
    }, [initialActivities])

    // Calendar logic helpers
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayIndex = new Date(year, month, 1).getDay()

    const prevMonthDays = new Date(year, month, 0).getDate()

    const calendarCells: { date: Date; isCurrentMonth: boolean }[] = []

    // 1. Padding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        calendarCells.push({
            date: new Date(year, month - 1, prevMonthDays - i),
            isCurrentMonth: false,
        })
    }

    // 2. Days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
        calendarCells.push({
            date: new Date(year, month, i),
            isCurrentMonth: true,
        })
    }

    // 3. Padding days from next month to complete standard grid (up to 42 cells)
    const remainingCells = 42 - calendarCells.length
    for (let i = 1; i <= remainingCells; i++) {
        calendarCells.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false,
        })
    }

    // Filter activities in memory
    const filteredActivities = activities.filter(act => {
        // Filter by Agent
        if (selectedAgentId !== 'all' && act.assigned_agent_id !== selectedAgentId) {
            return false
        }
        // Filter by Type
        if (!filterTypes.includes(act.type)) {
            return false
        }
        // Filter by Status
        if (!filterStatuses.includes(act.status)) {
            return false
        }
        return true
    })

    // Group filtered activities by formatted date key
    const activitiesByDate: Record<string, Activity[]> = {}
    filteredActivities.forEach(act => {
        const key = formatDateKey(act.due_date)
        if (key) {
            if (!activitiesByDate[key]) {
                activitiesByDate[key] = []
            }
            activitiesByDate[key].push(act)
        }
    })

    // Actions
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1))
    }

    const handleToday = () => {
        const today = new Date()
        setCurrentMonth(today)
        setSelectedDate(today)
    }

    const toggleTypeFilter = (type: ActivityType) => {
        if (filterTypes.includes(type)) {
            setFilterTypes(filterTypes.filter(t => t !== type))
        } else {
            setFilterTypes([...filterTypes, type])
        }
    }

    const toggleStatusFilter = (status: ActivityStatus) => {
        if (filterStatuses.includes(status)) {
            setFilterStatuses(filterStatuses.filter(s => s !== status))
        } else {
            setFilterStatuses([...filterStatuses, status])
        }
    }

    // Complete activity status toggle
    const handleToggleStatus = async (activityId: string, currentStatus: ActivityStatus) => {
        const nextStatus: ActivityStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING'

        startTransition(async () => {
            const res = await updateActivityStatusAction(activityId, nextStatus)
            if (res.success && res.activity) {
                // Update local state
                setActivities(prev =>
                    prev.map(a => (a.activity_id === activityId ? { ...a, status: nextStatus } : a))
                )
                toast.success(`Activity marked as ${nextStatus.toLowerCase()}`)
            } else {
                toast.error('Failed to update activity status')
            }
        })
    }

    // Quick Task Submission
    const handleQuickTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTitle.trim()) {
            toast.error('Please enter a summary title')
            return
        }

        const taskDueDate = new Date(selectedDate)
        // Set time to end of work hours so due_date is accurate
        taskDueDate.setHours(17, 0, 0, 0)

        const creatorSuffix = `\n\n---\nCreated By: ${currentUser.full_name}`
        const taskData: Partial<Activity> = {
            title: newTitle,
            description: newDesc.trim() ? `${newDesc.trim()}${creatorSuffix}` : `Created By: ${currentUser.full_name}`,
            type: newType,
            status: 'PENDING',
            due_date: taskDueDate.toISOString(),
            assigned_agent_id: newAgentId,
            related_lead_id: newLeadId !== 'none' ? newLeadId : null,
            related_client_id: newClientId !== 'none' ? newClientId : null,
        }

        startTransition(async () => {
            const res = await createActivityAction(taskData)
            if (res.success && res.activity) {
                // Construct completed activity record
                const newAct: Activity = {
                    ...res.activity,
                    assigned_agent: staffMembers.find(s => s.id === newAgentId) || null,
                    related_lead: leadsList.find(l => l.id === newLeadId) ? { lead_id: newLeadId, full_name: leadsList.find(l => l.id === newLeadId)!.name, phone_number: '' } : null,
                    related_client: clientsList.find(c => c.id === newClientId) ? { client_id: newClientId, full_name: clientsList.find(c => c.id === newClientId)!.name, mobile_number: '' } : null,
                }
                setActivities(prev => [newAct, ...prev])
                toast.success('Task scheduled successfully')

                // Clear fields
                setNewTitle('')
                setNewDesc('')
                setNewLeadId('none')
                setNewClientId('none')
            } else {
                toast.error(res.error || 'Failed to create task')
            }
        })
    }

    const selectedDateKey = formatDateKey(selectedDate)
    const selectedDateActivities = activitiesByDate[selectedDateKey] || []

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                        Operations & Tasks Calendar
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                        Track reminders, client callback appointments, and tasks for staff operational efficiency.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleToday} className="font-semibold text-xs rounded-lg">
                        Today
                    </Button>
                    <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-lg border border-gray-200/50">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={handlePrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-bold px-3 text-gray-700 select-none min-w-[100px] text-center">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

                {/* Sidebar Filter and controls */}
                <div className="xl:col-span-1 space-y-6">
                    <Card className="shadow-sm border-gray-100 bg-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-900">
                                <Filter className="h-4 w-4 text-primary" />
                                Filter Operational Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">

                            {/* MD Agent Selector */}
                            {userRole !== 'STAFF' && userRole !== 'AGENT' && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500">Filter by Agent</Label>
                                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                        <SelectTrigger className="w-full text-xs h-9 bg-gray-50/50 rounded-lg">
                                            <SelectValue placeholder="All Agents" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Staff Members</SelectItem>
                                            {staffMembers.map(member => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Activity Type checkboxes */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-500">Activity Type</Label>
                                <div className="space-y-1.5">
                                    {[
                                        { type: 'REMINDER' as ActivityType, label: '📞 Reminders & Callbacks', color: 'bg-amber-100 text-amber-800' },
                                        { type: 'TASK' as ActivityType, label: '📋 Operational Tasks', color: 'bg-violet-100 text-violet-800' },
                                        { type: 'CALL_LOG' as ActivityType, label: '💬 Logged Calls', color: 'bg-blue-100 text-blue-800' }
                                    ].map(item => (
                                        <label key={item.type} className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100/70 border border-gray-200/40 rounded-lg cursor-pointer transition-colors text-xs text-gray-700">
                                            <input
                                                type="checkbox"
                                                className="rounded text-primary focus:ring-primary border-gray-300 w-3.5 h-3.5"
                                                checked={filterTypes.includes(item.type)}
                                                onChange={() => toggleTypeFilter(item.type)}
                                            />
                                            <span>{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status Filter checkboxes */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-500">Completion Status</Label>
                                <div className="space-y-1.5">
                                    {[
                                        { status: 'PENDING' as ActivityStatus, label: '⏳ Pending Tasks' },
                                        { status: 'COMPLETED' as ActivityStatus, label: '✅ Completed Tasks' }
                                    ].map(item => (
                                        <label key={item.status} className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100/70 border border-gray-200/40 rounded-lg cursor-pointer transition-colors text-xs text-gray-700">
                                            <input
                                                type="checkbox"
                                                className="rounded text-primary focus:ring-primary border-gray-300 w-3.5 h-3.5"
                                                checked={filterStatuses.includes(item.status)}
                                                onChange={() => toggleStatusFilter(item.status)}
                                            />
                                            <span>{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Legend Card */}
                    <Card className="shadow-sm border-gray-100 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Calendar Guide</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 text-gray-600">
                            {userRole === 'STAFF' || userRole === 'AGENT' ? (
                                <p className="leading-relaxed">Click any day cell to view your scheduled tasks and callbacks assigned to you.</p>
                            ) : (
                                <p className="leading-relaxed">Click any day cell to view scheduled events and add new callbacks or tasks for your team.</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <span>Reminders / Site Visits</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-violet-600 shrink-0" />
                                <span>Operational Tasks</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>Resolved / Done</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Calendar View */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-400 uppercase py-2 select-none border-b border-gray-100">
                            <div>Sun</div>
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>
                        </div>

                        {/* Month Grid Cells */}
                        <div className="grid grid-cols-7 gap-1 mt-1 bg-gray-50/20">
                            {calendarCells.map((cell, idx) => {
                                const key = formatDateKey(cell.date)
                                const cellActivities = activitiesByDate[key] || []
                                const isSelected = formatDateKey(selectedDate) === key
                                const isToday = formatDateKey(new Date()) === key

                                return (
                                    <div
                                        key={`${key}-${idx}`}
                                        className={`min-h-[75px] md:min-h-[90px] p-1.5 flex flex-col justify-between border border-gray-100 bg-white rounded-lg cursor-pointer transition-all duration-200 ${cell.isCurrentMonth ? 'text-gray-900' : 'text-gray-300 opacity-40'
                                            } ${isSelected
                                                ? 'ring-2 ring-primary ring-offset-1 border-transparent z-10 shadow-sm'
                                                : 'hover:bg-gray-50/80 hover:scale-[1.01]'
                                            }`}
                                        onClick={() => setSelectedDate(cell.date)}
                                    >
                                        <div className="flex justify-between items-start">
                                            {isToday ? (
                                                <span className="text-[10px] md:text-xs font-bold text-white bg-primary h-5 w-5 rounded-full flex items-center justify-center -ml-0.5 mt-0.5">
                                                    {cell.date.getDate()}
                                                </span>
                                            ) : (
                                                <span className={`text-[10px] md:text-xs font-semibold ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                                                    {cell.date.getDate()}
                                                </span>
                                            )}
                                            {cellActivities.length > 0 && (
                                                <span className="text-[9px] font-extrabold text-gray-400 bg-gray-100 px-1 rounded">
                                                    {cellActivities.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Activity dot list inside cell */}
                                        <div className="space-y-0.5 mt-1 overflow-hidden max-h-[50px]">
                                            {cellActivities.slice(0, 3).map(act => {
                                                let badgeColor = 'bg-amber-500'
                                                if (act.status === 'COMPLETED') {
                                                    badgeColor = 'bg-emerald-500'
                                                } else if (act.type === 'TASK') {
                                                    badgeColor = 'bg-violet-600'
                                                } else if (act.type === 'CALL_LOG') {
                                                    badgeColor = 'bg-blue-500'
                                                }

                                                return (
                                                    <div
                                                        key={act.activity_id}
                                                        className="flex items-center gap-1 text-[9px] md:text-[10px] font-medium leading-none px-1 py-0.5 rounded bg-gray-50 truncate"
                                                        title={act.title}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeColor}`} />
                                                        <span className="truncate text-gray-700">{act.title}</span>
                                                    </div>
                                                )
                                            })}
                                            {cellActivities.length > 3 && (
                                                <div className="text-[8px] text-gray-400 text-center font-bold">
                                                    +{cellActivities.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Side Panel: Detail list and Schedule Quick Task Form */}
                <div className="xl:col-span-1 space-y-6">

                    {/* Events List for selected Date */}
                    <Card className="shadow-sm border-gray-100 bg-white">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-gray-900">
                                <Clock className="h-4.5 w-4.5 text-primary" />
                                {formatDayLabel(selectedDate) === formatDayLabel(new Date()) ? 'Today\'s Schedule' : 'Schedule Details'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} has {selectedDateActivities.length} operational tasks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 px-3 max-h-[300px] overflow-y-auto space-y-3">
                            {selectedDateActivities.length === 0 ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center text-gray-400">
                                    <ClipboardCheck className="h-8 w-8 stroke-1 mb-1.5 text-gray-300" />
                                    <p className="text-xs">No tasks scheduled for this date.</p>
                                </div>
                            ) : (
                                selectedDateActivities.map(act => {
                                    const isDone = act.status === 'COMPLETED'

                                    // Parse description metadata
                                    let displayDesc = act.description || ''
                                    let createdBy = ''
                                    if (act.description) {
                                        if (act.description.includes('\n\n---\nCreated By: ')) {
                                            const parts = act.description.split('\n\n---\nCreated By: ')
                                            displayDesc = parts[0]
                                            createdBy = parts[1]
                                        } else if (act.description.startsWith('Created By: ')) {
                                            displayDesc = ''
                                            createdBy = act.description.replace('Created By: ', '')
                                        }
                                    }

                                    return (
                                        <div
                                            key={act.activity_id}
                                            className={`p-3 rounded-xl border transition-all duration-200 ${isDone
                                                ? 'bg-emerald-50/30 border-emerald-100'
                                                : 'bg-gray-50/50 border-gray-200/50 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer h-4 w-4 shrink-0"
                                                    checked={isDone}
                                                    onChange={() => handleToggleStatus(act.activity_id, act.status)}
                                                    disabled={isPending}
                                                />
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <p className={`text-xs font-bold leading-tight ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                        {act.title}
                                                    </p>
                                                    {displayDesc && (
                                                        <p className="text-[10px] text-gray-500 leading-normal line-clamp-2">
                                                            {displayDesc}
                                                        </p>
                                                    )}

                                                    {/* Meta linkages */}
                                                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 font-medium capitalize bg-white">
                                                            {act.type.toLowerCase().replace('_', ' ')}
                                                        </Badge>
                                                        {act.assigned_agent && (
                                                            <div className="flex items-center gap-0.5 text-[9px] text-gray-500 bg-white border px-1 rounded">
                                                                <User className="h-2 w-2" />
                                                                <span className="truncate max-w-[65px]">{act.assigned_agent.full_name}</span>
                                                            </div>
                                                        )}
                                                        {createdBy && (
                                                            <div className="flex items-center gap-0.5 text-[9px] text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                                                                <span className="font-semibold text-[8px] text-gray-400 uppercase mr-0.5">By:</span>
                                                                <span className="truncate max-w-[70px]">{createdBy}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Associated Lead or Client reference links */}
                                                    {act.related_lead && (
                                                        <div className="flex items-center justify-between bg-white border border-amber-100 rounded-lg p-1.5 mt-2">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-amber-800 truncate">
                                                                <Phone className="h-2.5 w-2.5 text-amber-500" />
                                                                <span className="truncate">Lead: {act.related_lead.full_name}</span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 text-amber-600 hover:text-amber-800 shrink-0"
                                                                onClick={() => router.push(`/dashboard/leads?search=${encodeURIComponent(act.related_lead?.full_name || '')}`)}
                                                            >
                                                                <ArrowUpRight className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {act.related_client && (
                                                        <div className="flex items-center justify-between bg-white border border-primary/10 rounded-lg p-1.5 mt-2">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-primary truncate">
                                                                <User className="h-2.5 w-2.5 text-primary" />
                                                                <span className="truncate">Client: {act.related_client.full_name}</span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 text-primary hover:text-primary shrink-0"
                                                                onClick={() => router.push(`/dashboard/clients/${act.related_client?.client_id}`)}
                                                            >
                                                                <ArrowUpRight className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule Activity Form */}
                    {userRole !== 'STAFF' && userRole !== 'AGENT' && (
                        <Card className="shadow-sm border-gray-100 bg-white">
                            <CardHeader className="pb-3 border-b border-gray-100">
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-gray-900">
                                    <Plus className="h-4.5 w-4.5 text-primary" />
                                    Schedule Operations Callback
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Set a callback reminder for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <form onSubmit={handleQuickTaskSubmit} className="space-y-3.5">
                                    <div className="space-y-1">
                                        <Label htmlFor="title" className="text-xs font-semibold text-gray-700">Summary *</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Call back customer / Collect Aadhaar copy"
                                            className="text-xs h-9 rounded-lg"
                                            value={newTitle}
                                            onChange={e => setNewTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="desc" className="text-xs font-semibold text-gray-700">Detailed Description</Label>
                                        <Textarea
                                            id="desc"
                                            placeholder="Optional details, notes, etc."
                                            className="text-xs rounded-lg min-h-[50px] resize-none"
                                            value={newDesc}
                                            onChange={e => setNewDesc(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Task Type</Label>
                                            <Select value={newType} onValueChange={(v: ActivityType) => setNewType(v)}>
                                                <SelectTrigger className="text-xs h-9 rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="REMINDER">Reminder</SelectItem>
                                                    <SelectItem value="TASK">Admin Task</SelectItem>
                                                    <SelectItem value="CALL_LOG">Call Log</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {userRole !== 'STAFF' && userRole !== 'AGENT' ? (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Assigned Agent</Label>
                                                <Select value={newAgentId} onValueChange={setNewAgentId}>
                                                    <SelectTrigger className="text-xs h-9 rounded-lg">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {staffMembers.map(member => (
                                                            <SelectItem key={member.id} value={member.id}>
                                                                {member.full_name.split(' ')[0]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-gray-700">Assigned Agent</Label>
                                                <Input
                                                    className="text-xs h-9 rounded-lg bg-gray-50 text-gray-500 font-medium"
                                                    value={currentUser.full_name}
                                                    disabled
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Link to Lead</Label>
                                            <Select value={newLeadId} onValueChange={setNewLeadId}>
                                                <SelectTrigger className="text-xs h-9 rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {leadsList.map(lead => (
                                                        <SelectItem key={lead.id} value={lead.id}>
                                                            {lead.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-gray-700">Link to Client</Label>
                                            <Select value={newClientId} onValueChange={setNewClientId}>
                                                <SelectTrigger className="text-xs h-9 rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {clientsList.map(client => (
                                                        <SelectItem key={client.id} value={client.id}>
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={isPending} className="w-full text-xs h-9 font-bold bg-primary text-white rounded-lg hover:bg-primary/95 flex items-center justify-center gap-1">
                                        <Plus className="h-4 w-4" />
                                        {isPending ? 'Scheduling...' : 'Schedule Activity'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                </div>

            </div>
        </div>
    )
}