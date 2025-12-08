import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/agent/page-header'
import Link from 'next/link'
import { Users, Calculator, Camera, LogOut, TrendingUp, DollarSign, FileText } from 'lucide-react'

export default async function AgentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: userData } = await supabase
        .from('app_users')
        .select('full_name')
        .eq('id', user!.id)
        .single()

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="FinFlow"
                subtitle={userData?.full_name || 'Agent Dashboard'}
                showNotifications={true}
                actions={
                    <form action="/api/auth/signout" method="POST">
                        <Button variant="ghost" size="icon" type="submit" className="h-10 w-10 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </form>
                }
            />

            {/* Main Content */}
            <main className="p-4 pb-24">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white shadow-lg">
                    <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
                    <p className="text-blue-100 text-sm">Manage your loans and clients efficiently</p>
                </div>

                {/* Quick Action Cards */}
                <div className="space-y-3 mb-6">
                    <Link href="/agent/clients">
                        <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Manage Clients</h3>
                                        <p className="text-sm text-gray-600">View and manage your clients</p>
                                    </div>
                                    <div className="text-gray-400">
                                        <span>→</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/agent/quotation">
                        <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Calculator className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Create Quotation</h3>
                                        <p className="text-sm text-gray-600">Generate instant loan quotes</p>
                                    </div>
                                    <div className="text-gray-400">
                                        <span>→</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/agent/attendance">
                        <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Camera className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
                                        <p className="text-sm text-gray-600">Check-in with location & photo</p>
                                    </div>
                                    <div className="text-gray-400">
                                        <span>→</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="border border-gray-200 bg-white">
                        <CardContent className="p-4">
                            <TrendingUp className="h-8 w-8 mb-2 text-blue-600" />
                            <p className="text-2xl font-bold text-gray-900">0</p>
                            <p className="text-sm text-gray-600">Active Loans</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-white">
                        <CardContent className="p-4">
                            <FileText className="h-8 w-8 mb-2 text-blue-600" />
                            <p className="text-2xl font-bold text-gray-900">0</p>
                            <p className="text-sm text-gray-600">Quotations</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
