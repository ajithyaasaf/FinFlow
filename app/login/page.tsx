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
            const loginEmail = email.includes('@') ? email : `${email}@finflow.com`

            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
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
                if (userData.role === 'ADMIN' || userData.role === 'MD') {
                    window.location.href = '/dashboard'
                } else {
                    window.location.href = '/staff'
                }
            }
        } catch (error) {
            console.error('Login error:', error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Invalid login credentials')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Left Side: Modern Banner with soft text overlay */}
            <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 relative items-center justify-center overflow-hidden">
                <img
                    src="/login_banner.png"
                    alt="FinFlow Business Success"
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                <div className="relative z-10 p-12 lg:p-20 text-white space-y-6 max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold tracking-wide uppercase">Empowering Small Businesses</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                        Streamlined loans, built for modern growth.
                    </h1>
                    <p className="text-lg text-slate-200 font-medium leading-relaxed">
                        FinFlow connects staff and clients to deliver fast, secure microfinance solutions directly to local markets.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 md:w-1/2 lg:w-2/5 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative bg-white">
                <div className="my-auto max-w-md w-full mx-auto space-y-8">
                    {/* Header */}
                    <div className="space-y-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-airbnb-md">
                            <svg
                                className="w-6 h-6 text-white"
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
                        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#222222] tracking-tight">
                            Welcome to FinFlow
                        </h2>
                        <p className="text-sm text-[#6a6a6a]">
                            Loan Management System. Enter your credentials to continue.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-semibold text-[#222222]">Login ID / Email</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="e.g. staff01 or admin@finflow.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all h-11"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-sm font-semibold text-[#222222]">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="rounded-xl border-gray-200 bg-[#f7f7f7]/30 focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all h-11"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 rounded-full text-sm font-semibold shadow-airbnb-md mt-2"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    {/* Demo Credentials Box */}
                    <div className="bg-[#f7f7f7] border border-gray-100 p-4 rounded-2xl space-y-2">
                        <p className="text-xs font-semibold text-[#222222] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Demo Credentials
                        </p>
                        <div className="text-[11px] text-[#6a6a6a] leading-relaxed">
                            <p><span className="font-semibold text-gray-700">MD:</span> md@finflow.com / password123</p>
                            <p><span className="font-semibold text-gray-700">Admin:</span> admin@finflow.com / password123</p>
                            <p><span className="font-semibold text-gray-700">Staff:</span> staff01 / password123</p>
                        </div>
                    </div>
                </div>

                {/* Godiva Tech Branding */}
                <div className="pt-8 text-center border-t border-gray-100 mt-auto">
                    <p className="text-xs text-[#6a6a6a]">
                        Developed by{' '}
                        <a
                            href="https://www.godivatech.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-800 hover:text-blue-600 transition-colors underline decoration-dotted"
                        >
                            Godiva Tech
                        </a>
                        , Madurai
                    </p>
                </div>
            </div>
        </div>
    )
}
