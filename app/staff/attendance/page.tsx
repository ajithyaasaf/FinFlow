'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/agent/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { AttendanceLog } from '@/types'

interface LocationData {
    latitude: number
    longitude: number
    accuracy: number
}

export default function AttendancePage() {
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [location, setLocation] = useState<LocationData | null>(null)
    const [lastCheckIn, setLastCheckIn] = useState<AttendanceLog | null>(null)
    const [gpsLoading, setGpsLoading] = useState(false)

    const captureLocation = () => {
        setGpsLoading(true)

        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            setGpsLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                })
                toast.success('Location captured successfully')
                setGpsLoading(false)
            },
            (error) => {
                let errorMessage = 'Failed to get location'
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable'
                        break
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out'
                        break
                }
                toast.error(errorMessage)
                setGpsLoading(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        )
    }

    const handleCheckIn = async () => {
        if (!location) {
            toast.error('Please capture your location first')
            return
        }

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Verify user active status
            const { data: profile } = await supabase
                .from('app_users')
                .select('status')
                .eq('id', user.id)
                .single()

            if (profile?.status === 'INACTIVE') {
                await supabase.auth.signOut()
                window.location.href = '/login'
                throw new Error('Your account is inactive. Please contact your administrator.')
            }

            // Create attendance log
            const { data, error } = await supabase
                .from('attendance_logs')
                .insert({
                    agent_id: user.id,
                    check_in_time: new Date().toISOString(),
                    check_in_details: {
                        lat: location.latitude,
                        lng: location.longitude,
                    }
                })
                .select()
                .single()

            if (error) throw error

            setLastCheckIn(data)
            toast.success('Attendance marked successfully!')

            // Reset form
            setLocation(null)

        } catch (error) {
            console.error('Error marking attendance:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to mark attendance')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f7f7f7]">
            <PageHeader
                title="Attendance"
                subtitle="Mark your daily check-in"
                backHref="/staff"
            />

            {/* Main Content */}
            <main className="p-4 pb-24 space-y-4 max-w-md mx-auto">
                {/* Last Check-In Status */}
                {lastCheckIn && (
                    <Card className="border border-emerald-100 bg-emerald-50/40 shadow-airbnb-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-emerald-900">Check-in Successful!</p>
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                        {formatDateTime(lastCheckIn.check_in_time)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Capture Location */}
                <Card className="border border-gray-100 shadow-airbnb-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className={`${location ? 'bg-emerald-50/30 border-b border-emerald-100/60' : 'bg-[#f7f7f7]/50 border-b border-gray-100'} p-4`}>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#222222]">
                            <MapPin className={`h-5 w-5 ${location ? 'text-emerald-600' : 'text-primary'}`} />
                            <span>Capture Location</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-[#6a6a6a]">
                            We need your location to verify you're at the office
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4 p-4">
                        {location ? (
                            <div className="bg-emerald-50/20 border border-emerald-100/80 rounded-2xl p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-emerald-900">Location Captured</span>
                                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                                </div>
                                <div className="text-[11px] text-emerald-800 space-y-0.5 bg-white border border-emerald-100 rounded-xl p-3">
                                    <p className="font-medium">Latitude: {location.latitude.toFixed(6)}</p>
                                    <p className="font-medium">Longitude: {location.longitude.toFixed(6)}</p>
                                    <p className="font-medium">Accuracy: ±{location.accuracy.toFixed(0)}m</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={captureLocation}
                                    disabled={gpsLoading}
                                    className="w-full mt-1.5 h-10 border-gray-200 rounded-full text-[#222222] font-semibold"
                                >
                                    {gpsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Recapture Location
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={captureLocation}
                                disabled={gpsLoading}
                                className="w-full h-11 rounded-full text-sm font-semibold"
                                size="lg"
                            >
                                {gpsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <MapPin className="mr-2 h-4.5 w-4.5" />
                                Get My Location
                            </Button>
                        )}

                        {!location && !gpsLoading && (
                            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3">
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4.5 w-4.5 text-primary mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-primary/80">
                                        Make sure location services are enabled on your device. You may need to grant permission when prompted.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Check-In Button */}
                <Button
                    onClick={handleCheckIn}
                    disabled={!location || loading}
                    className="w-full h-12 rounded-full text-sm font-semibold shadow-airbnb-md mt-2"
                    size="lg"
                >
                    {loading && <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />}
                    {loading ? 'Marking Attendance...' : (
                        <>
                            <CheckCircle className="mr-2 h-4.5 w-4.5" />
                            Check In
                        </>
                    )}
                </Button>
            </main>
        </div>
    )
}
