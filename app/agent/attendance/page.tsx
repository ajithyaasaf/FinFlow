'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { uploadSelfie } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Camera, MapPin, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import type { AttendanceLog } from '@/types'

interface LocationData {
    latitude: number
    longitude: number
    accuracy: number
}

export default function AttendancePage() {
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [location, setLocation] = useState<LocationData | null>(null)
    const [selfieFile, setSelfieFile] = useState<File | null>(null)
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
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
                console.error('Geolocation error:', error)

                let message = 'Failed to get location'
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Location permission denied. Please enable location access in your browser settings.'
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = 'Location information unavailable. Please check your GPS settings.'
                } else if (error.code === error.TIMEOUT) {
                    message = 'Location request timed out. Please try again.'
                }

                toast.error(message)
                setGpsLoading(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        )
    }

    const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (!file) return

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB')
            return
        }

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            toast.error('Please select a JPEG or PNG image')
            return
        }

        setSelfieFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setSelfiePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleCheckIn = async () => {
        if (!location) {
            toast.error('Please capture your location first')
            return
        }

        if (!selfieFile) {
            toast.error('Please take a selfie')
            return
        }

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Upload selfie
            toast.loading('Uploading selfie...', { id: 'selfie-upload' })
            const selfieUrl = await uploadSelfie(selfieFile)
            toast.dismiss('selfie-upload')

            // Insert attendance log
            const { data: attendance, error } = await supabase
                .from('attendance_logs')
                .insert({
                    agent_id: user.id,
                    check_in_details: {
                        lat: location.latitude,
                        lng: location.longitude,
                        selfie_url: selfieUrl,
                    },
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Attendance marked successfully!')

            // Reset form
            setLocation(null)
            setSelfieFile(null)
            setSelfiePreview(null)
            setLastCheckIn(attendance)

        } catch (error) {
            console.error('Check-in error:', error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Failed to mark attendance')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/agent">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Attendance</h1>
                        <p className="text-xs text-gray-600">Mark your daily check-in</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 pb-24 space-y-4">
                {/* Last Check-In Status */}
                {lastCheckIn && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-900">Check-in Successful!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        {formatDateTime(lastCheckIn.check_in_time)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: Capture Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${location ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <span className={`text-sm font-bold ${location ? 'text-green-600' : 'text-gray-400'}`}>1</span>
                            </div>
                            Capture Location
                        </CardTitle>
                        <CardDescription>
                            We need your location to verify you're at the office
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {location ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-green-900">Location Captured</span>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-xs text-green-700 space-y-1">
                                    <p>Latitude: {location.latitude.toFixed(6)}</p>
                                    <p>Longitude: {location.longitude.toFixed(6)}</p>
                                    <p>Accuracy: ±{location.accuracy.toFixed(0)}m</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={captureLocation}
                                    disabled={gpsLoading}
                                    className="w-full mt-2"
                                >
                                    {gpsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Recapture Location
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={captureLocation}
                                disabled={gpsLoading}
                                className="w-full"
                                size="lg"
                            >
                                {gpsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <MapPin className="mr-2 h-4 w-4" />
                                Get My Location
                            </Button>
                        )}

                        {!location && !gpsLoading && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                    <p className="text-xs text-amber-800">
                                        Make sure location services are enabled on your device. You may need to grant permission when prompted.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Take Selfie */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selfieFile ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <span className={`text-sm font-bold ${selfieFile ? 'text-green-600' : 'text-gray-400'}`}>2</span>
                            </div>
                            Take Selfie
                        </CardTitle>
                        <CardDescription>
                            Capture a clear photo of yourself for verification
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handleSelfieCapture}
                            className="hidden"
                        />

                        {selfiePreview ? (
                            <div className="space-y-3">
                                <img
                                    src={selfiePreview}
                                    alt="Selfie Preview"
                                    className="w-full h-64 object-cover rounded-lg border-2 border-green-200"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full"
                                >
                                    <Camera className="mr-2 h-4 w-4" />
                                    Retake Selfie
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!location}
                                className="w-full"
                                size="lg"
                            >
                                <Camera className="mr-2 h-4 w-4" />
                                Open Camera
                            </Button>
                        )}

                        {!location && (
                            <p className="text-xs text-gray-500 text-center">
                                Please capture your location first
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Check-In Button */}
                <Button
                    onClick={handleCheckIn}
                    disabled={!location || !selfieFile || loading}
                    className="w-full"
                    size="lg"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Marking Attendance...' : 'Check In'}
                </Button>
            </main>
        </div>
    )
}
