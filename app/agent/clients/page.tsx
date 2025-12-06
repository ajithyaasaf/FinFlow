'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ChevronRight, User, Search, Plus, FileText, Phone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Client {
    client_id: string
    full_name: string
    mobile_number: string
    pan_number: string
    created_at: string
    loans: {
        loan_id: string
        amount: number
        status: string
        created_at: string
    }[]
}

export default function AgentClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('clients')
            .select(`
                *,
                loans:loan_applications(
                    loan_id,
                    amount,
                    status:process_stage,
                    created_at
                )
            `)
            .eq('onboarding_agent_id', user.id)
            .order('created_at', { ascending: false })

        setClients(data || [])
        setLoading(false)
    }

    const filteredClients = clients.filter(client =>
        client.full_name.toLowerCase().includes(search.toLowerCase()) ||
        client.mobile_number.includes(search) ||
        client.pan_number?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-lg font-bold text-gray-900">My Clients</h1>
                    <Badge variant="secondary">{clients.length} clients</Badge>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name, mobile, or PAN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </header>

            <main className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>{search ? 'No clients match your search' : 'No clients found'}</p>
                        <p className="text-sm mt-2">Create a quotation to add new clients</p>
                        <Button asChild className="mt-4">
                            <Link href="/agent/quotation">
                                <Plus className="h-4 w-4 mr-2" />
                                New Quotation
                            </Link>
                        </Button>
                    </div>
                ) : (
                    filteredClients.map((client) => {
                        const activeLoan = client.loans?.[0]
                        const loanCount = client.loans?.length || 0

                        return (
                            <Card key={client.client_id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                {client.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {client.mobile_number}
                                                </p>
                                                {client.pan_number && (
                                                    <p className="text-xs text-gray-400">PAN: {client.pan_number}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {activeLoan && (
                                                <Badge
                                                    variant={activeLoan.status === 'Disbursed' ? 'default' : 'secondary'}
                                                    className="mb-1"
                                                >
                                                    {activeLoan.status}
                                                </Badge>
                                            )}
                                            <p className="text-xs text-gray-400">
                                                {loanCount} {loanCount === 1 ? 'loan' : 'loans'}
                                            </p>
                                        </div>
                                    </div>

                                    {activeLoan && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex justify-between items-center text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-500">Latest Loan</p>
                                                    <p className="font-semibold text-gray-900">{formatCurrency(activeLoan.amount)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="mt-4 flex gap-2">
                                        {activeLoan ? (
                                            <Button asChild variant="default" size="sm" className="flex-1">
                                                <Link href={`/agent/loans/${activeLoan.loan_id}`}>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View Loan
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button asChild variant="default" size="sm" className="flex-1">
                                                <Link href="/agent/quotation">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    New Quote
                                                </Link>
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.location.href = `tel:${client.mobile_number}`}
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </main>
        </div>
    )
}
