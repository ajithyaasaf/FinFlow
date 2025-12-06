'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                throw error
            }

            if (data.user) {
                // Get user role from app_users table
                const { data: userData, error: userError } = await supabase
                    .from('app_users')
                    .select('role, full_name')
                    .eq('id', data.user.id)
                    .single()

                if (userError) {
                    throw new Error('User profile not found')
                }

                toast.success(`Welcome back, ${userData.full_name}!`)

                // Redirect based on role
                if (userData.role === 'ADMIN') {
                    router.push('/dashboard')
                } else {
                    router.push('/agent')
                }

                // Force refresh to trigger middleware
                router.refresh()
            }
        } catch (error) {
            console.error('Login error:', error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Invalid email or password')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold">FinFlow</CardTitle>
                    <CardDescription>
                        Loan Management System
                        <br />
                        Enter your credentials to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="agent@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-xs text-center text-muted-foreground">
                        <p>Demo Credentials:</p>
                        <p className="mt-1">
                            Admin: admin@finflow.com / password
                            <br />
                            Agent: agent@finflow.com / password
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Godiva Tech Branding */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-xs text-gray-500">
                    Developed by{' '}
                    <a
                        href="https://www.godivatech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-700 hover:text-primary transition-colors underline decoration-dotted"
                    >
                        Godiva Tech
                    </a>
                    , Madurai
                </p>
            </div>
        </div>
    )
}
