import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Calculator, Camera, LogOut } from 'lucide-react'

export default async function AgentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: userData } = await supabase
        .from('app_users')
        .select('full_name')
        .eq('id', user!.id)
        .single()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
            {/* Mobile Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">FinFlow</h1>
                    <p className="text-sm text-gray-600">{userData?.full_name}</p>
                </div>
                <form action="/api/auth/signout" method="POST">
                    <Button variant="ghost" size="icon" type="submit">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </form>
            </header>

            {/* Main Content */}
            <main className="p-4 pb-24">
                <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome to FinFlow</CardTitle>
                            <CardDescription>
                                Your mobile loan management companion
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/agent/clients">
                                <Button className="w-full justify-start" variant="outline">
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Clients
                                </Button>
                            </Link>
                            <Link href="/agent/quotation">
                                <Button className="w-full justify-start" variant="outline">
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Create Quotation
                                </Button>
                            </Link>
                            <Link href="/agent/attendance">
                                <Button className="w-full justify-start" variant="outline">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Mark Attendance
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Stats coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Bottom Navigation - Coming Soon */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
                <div className="flex justify-around">
                    <div className="text-center text-xs text-gray-500">
                        Navigation coming soon
                    </div>
                </div>
            </nav>
        </div>
    )
}
