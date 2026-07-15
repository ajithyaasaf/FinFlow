'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, Trash2, Edit, Plus, Users, ImageIcon, ExternalLink } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { saveManualAttendanceAction, deleteAttendanceLogAction } from '@/app/actions/attendance'
import type { AttendanceLogWithAgent } from '@/lib/services/attendanceService'
import type { AppUser } from '@/types'

interface AttendanceClientProps {
    initialLogs: AttendanceLogWithAgent[]
    agents: AppUser[]
    selectedDate: string
}

export function AttendanceClient({ initialLogs, agents, selectedDate }: AttendanceClientProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)
    const [deleteConfirmLogId, setDeleteConfirmLogId] = useState<string | null>(null)

    // Form states
    const [editLogId, setEditLogId] = useState<string | null>(null)
    const [selectedAgentId, setSelectedAgentId] = useState('')
    
    // 12-hour format states
    const [checkInDate, setCheckInDate] = useState('')
    const [checkInHour, setCheckInHour] = useState('12')
    const [checkInMinute, setCheckInMinute] = useState('00')
    const [checkInAmPm, setCheckInAmPm] = useState('AM')
    
    const [latitude, setLatitude] = useState('12.9252') // Default office latitude
    const [longitude, setLongitude] = useState('79.1198') // Default office longitude
    const [selfieUrl, setSelfieUrl] = useState('')

    // Date navigation
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.push(`/dashboard/attendance?date=${e.target.value}`)
    }

    const parseDateTimeToStates = (dateObj: Date) => {
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        setCheckInDate(`${year}-${month}-${day}`)

        let hours = dateObj.getHours()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12 // the hour '0' should be '12'
        
        setCheckInHour(String(hours).padStart(2, '0'))
        setCheckInMinute(String(dateObj.getMinutes()).padStart(2, '0'))
        setCheckInAmPm(ampm)
    }

    const openAddDialog = () => {
        setEditLogId(null)
        setSelectedAgentId(agents[0]?.id || '')
        
        const now = new Date()
        parseDateTimeToStates(now)
        
        setLatitude('12.9252')
        setLongitude('79.1198')
        setSelfieUrl('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop&q=80') // Default manual checkin placeholder
        setIsOpen(true)
    }

    const openEditDialog = (log: AttendanceLogWithAgent) => {
        setEditLogId(log.log_id)
        setSelectedAgentId(log.agent_id)
        
        const logDate = new Date(log.check_in_time)
        parseDateTimeToStates(logDate)
        
        const details = log.check_in_details || {}
        setLatitude(String(details.lat ?? '12.9252'))
        setLongitude(String(details.lng ?? '79.1198'))
        setSelfieUrl(details.selfie_url || '')
        setIsOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAgentId || !checkInDate || !checkInHour || !checkInMinute || !checkInAmPm) {
            toast.error('Please fill in all required fields')
            return
        }

        // Convert 12-hour format to 24-hour time string
        let hours = parseInt(checkInHour)
        if (checkInAmPm === 'PM' && hours < 12) {
            hours += 12
        } else if (checkInAmPm === 'AM' && hours === 12) {
            hours = 0
        }

        const timeString = `${String(hours).padStart(2, '0')}:${checkInMinute}:00`
        const combinedDateTimeStr = `${checkInDate}T${timeString}`
        const finalCheckInTime = new Date(combinedDateTimeStr).toISOString()

        setLoading(true)
        const res = await saveManualAttendanceAction({
            agentId: selectedAgentId,
            checkInTime: finalCheckInTime,
            latitude: parseFloat(latitude) || 0,
            longitude: parseFloat(longitude) || 0,
            selfieUrl: selfieUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop&q=80'
        })

        setLoading(false)
        if (res.success) {
            toast.success(editLogId ? 'Attendance log updated successfully' : 'Manual attendance logged successfully')
            setIsOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || 'Failed to save attendance')
        }
    }

    const handleDelete = async (logId: string) => {
        setDeleteLoading(logId)
        const res = await deleteAttendanceLogAction(logId)
        setDeleteLoading(null)

        if (res.success) {
            toast.success('Attendance record deleted')
            router.refresh()
        } else {
            toast.error(res.error || 'Failed to delete record')
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Attendance & Field Tracking
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Monitor staff check-ins, verify locations on Google Maps, and manage manual logs
                    </p>
                </div>
                <Button onClick={openAddDialog} className="gap-2 self-start md:self-auto rounded-full px-5">
                    <Plus className="h-4 w-4" />
                    Add Manual Check-In
                </Button>
            </div>

            {/* Filters Bar */}
            <Card className="shadow-airbnb-md border-0 bg-white rounded-2xl">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <Label htmlFor="date-select" className="text-sm font-medium text-[#222222] whitespace-nowrap">
                            Selected Date:
                        </Label>
                    </div>
                    <Input
                        id="date-select"
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="max-w-xs border-gray-200 bg-[#f7f7f7]/60 hover:bg-[#f7f7f7] focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 rounded-full px-4 py-2 transition-all shadow-none"
                    />
                </CardContent>
            </Card>

            {/* Attendance Logs List */}
            <Card className="shadow-airbnb-md border-0 bg-white rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Check-Ins for {selectedDate}</CardTitle>
                    <CardDescription>
                        {initialLogs.length} active staff check-in{initialLogs.length !== 1 ? 's' : ''} logged today
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {initialLogs.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No check-in logs found</p>
                            <p className="text-xs text-gray-400 mt-1 mb-4">
                                No staff have checked in yet on this date
                            </p>
                            <Button variant="outline" onClick={openAddDialog} className="gap-2 rounded-full px-5">
                                <Plus className="h-4 w-4" />
                                Log Attendance Manually
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {initialLogs.map((log) => {
                                const details = log.check_in_details || {}
                                const lat = typeof details.lat === 'number' ? details.lat : 12.9252
                                const lng = typeof details.lng === 'number' ? details.lng : 79.1198
                                const selfie = details.selfie_url || ''
                                const isManual = selfie.includes('unsplash') || selfie.includes('placehold.co') || !selfie

                                return (
                                    <div
                                        key={log.log_id}
                                        className="border border-gray-100/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-airbnb-lg transition-all duration-300 bg-white"
                                    >
                                        <div className="space-y-3">
                                            {/* Agent Detail */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-[#222222]">{log.agent.full_name}</h3>
                                                    <p className="text-xs text-[#6a6a6a]">{log.agent.email}</p>
                                                </div>
                                                <Badge 
                                                    variant="outline" 
                                                    className={`text-[10px] rounded-full px-2.5 py-0.5 border font-semibold ${
                                                        isManual 
                                                            ? 'bg-gray-50 text-gray-600 border-gray-200' 
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    }`}
                                                >
                                                    {isManual ? 'Manual Entry' : 'GPS Check-In'}
                                                </Badge>
                                            </div>

                                            {/* Selfie and Location info */}
                                            <div className="flex gap-3 items-center bg-[#f7f7f7] p-3 rounded-2xl border border-gray-100/50">
                                                {selfie ? (
                                                    <div className="overflow-hidden rounded-xl w-16 h-16 border border-gray-200/60 bg-white shrink-0">
                                                        <img
                                                            src={selfie}
                                                            alt="Staff Selfie"
                                                            onClick={() => setLightboxImage(selfie)}
                                                            className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 bg-white border border-gray-200/60 rounded-xl flex items-center justify-center shrink-0">
                                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="text-xs space-y-1">
                                                    <p className="flex items-center gap-1.5 text-[#6a6a6a]">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        <span>{formatDateTime(log.check_in_time)}</span>
                                                    </p>
                                                    <p className="flex items-center gap-1.5 text-[#6a6a6a]">
                                                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate">
                                                            {lat.toFixed(4)}, {lng.toFixed(4)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 mt-4 gap-2">
                                            <a
                                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#222222] font-semibold hover:underline flex items-center gap-1.5 transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                                View Map
                                            </a>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(log)}
                                                    className="h-8 w-8 rounded-full border border-gray-150 text-gray-500 hover:text-[#222222] hover:bg-gray-100/50 hover:scale-105 transition-all duration-200"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={deleteLoading === log.log_id}
                                                    onClick={() => setDeleteConfirmLogId(log.log_id)}
                                                    className="h-8 w-8 rounded-full border border-red-100 text-red-500 hover:text-red-600 hover:bg-red-50/50 hover:scale-105 transition-all duration-200"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Manual Attendance & Edit Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-airbnb-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#222222]">
                            {editLogId ? 'Edit Attendance Log' : 'Add Manual Attendance'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#6a6a6a]">
                            Create or override attendance check-ins for staff.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="agent" className="text-sm font-semibold text-[#222222]">Select Staff</Label>
                            {editLogId ? (
                                <Input
                                    value={agents.find(a => a.id === selectedAgentId)?.full_name || ''}
                                    disabled
                                    className="bg-[#f7f7f7] border-gray-200 text-[#6a6a6a] rounded-xl"
                                />
                            ) : (
                                <SearchableSelect
                                    options={agents.map((agent) => ({
                                        value: agent.id,
                                        label: `${agent.full_name} (${agent.email})`,
                                        searchString: `${agent.full_name} ${agent.email}`
                                    }))}
                                    value={selectedAgentId}
                                    onValueChange={setSelectedAgentId}
                                    placeholder="Select a staff member"
                                    searchPlaceholder="Search staff by name or email..."
                                    className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 hover:bg-[#f7f7f7]/50 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all h-10 shadow-none text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="check-in-date" className="text-sm font-semibold text-[#222222]">Check-In Date</Label>
                            <Input
                                id="check-in-date"
                                type="date"
                                value={checkInDate}
                                onChange={(e) => setCheckInDate(e.target.value)}
                                className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-[#222222]">Check-In Time (12-Hour Format)</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {/* Hour Select */}
                                <Select value={checkInHour} onValueChange={setCheckInHour}>
                                    <SelectTrigger className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all">
                                        <SelectValue placeholder="Hour" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-airbnb-lg border-gray-150 max-h-[200px] overflow-y-auto">
                                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                            <SelectItem key={h} value={h} className="rounded-lg">{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Minute Select */}
                                <Select value={checkInMinute} onValueChange={setCheckInMinute}>
                                    <SelectTrigger className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all">
                                        <SelectValue placeholder="Min" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-airbnb-lg border-gray-150 max-h-[200px] overflow-y-auto">
                                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                            <SelectItem key={m} value={m} className="rounded-lg">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* AM/PM Select */}
                                <Select value={checkInAmPm} onValueChange={setCheckInAmPm}>
                                    <SelectTrigger className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all">
                                        <SelectValue placeholder="AM/PM" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-airbnb-lg border-gray-150">
                                        <SelectItem value="AM" className="rounded-lg">AM</SelectItem>
                                        <SelectItem value="PM" className="rounded-lg">PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="latitude" className="text-sm font-semibold text-[#222222]">Latitude</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="longitude" className="text-sm font-semibold text-[#222222]">Longitude</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="selfie" className="text-sm font-semibold text-[#222222]">Selfie / Attachment URL</Label>
                            <Input
                                id="selfie"
                                placeholder="https://..."
                                value={selfieUrl}
                                onChange={(e) => setSelfieUrl(e.target.value)}
                                className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all"
                            />
                        </div>

                        <DialogFooter className="pt-2 gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-full px-5">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-full px-5">
                                {loading ? 'Saving...' : 'Save Record'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Selfie Lightbox Modal */}
            <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
                <DialogContent className="max-w-xl p-1 bg-black overflow-hidden flex items-center justify-center">
                    {lightboxImage && (
                        <div className="relative w-full max-h-[80vh] flex items-center justify-center">
                            <img
                                src={lightboxImage}
                                alt="Selfie Fullscreen"
                                className="max-w-full max-h-[75vh] object-contain rounded-md"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Attendance Log Confirmation Dialog */}
            <Dialog open={!!deleteConfirmLogId} onOpenChange={(open) => !open && setDeleteConfirmLogId(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600">Delete Attendance Record?</DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to delete this attendance record? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleteConfirmLogId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={async () => {
                                if (deleteConfirmLogId) {
                                    const id = deleteConfirmLogId
                                    setDeleteConfirmLogId(null)
                                    await handleDelete(id)
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
