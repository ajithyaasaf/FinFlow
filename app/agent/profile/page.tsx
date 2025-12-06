'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, Lock, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function AgentProfilePage() {
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            toast.success('Password updated successfully')
            setPassword('')
        } catch (error) {
            console.error('Update password error:', error)
            toast.error('Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
            </header>

            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Account Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-8 w-8 text-gray-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Agent Account</p>
                                <p className="text-sm text-gray-500">Managed by Admin</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>Update your login password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loading || !password} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>

                {/* Godiva Tech Branding */}
                <div className="text-center pt-4">
                    <p className="text-[10px] text-gray-400">
                        Developed by{' '}
                        <a
                            href="https://www.godivatech.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-600 hover:text-primary transition-colors"
                        >
                            Godiva Tech
                        </a>
                        , Madurai
                    </p>
                </div>
            </main>
        </div>
    )
}
