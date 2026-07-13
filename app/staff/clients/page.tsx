'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/agent/page-header'
import { ClientListSkeleton } from '@/components/agent/client-list-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ChevronRight, User, Search, Plus, FileText, Phone, Eye } from 'lucide-react'
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
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="My Clients"
                subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
                backHref="/staff"
                actions={
                    <Button asChild size="sm" className="h-9">
                        <Link href="/staff/clients/new">
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Link>
                    </Button>
                }
            />

            {/* Search Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name, mobile, or PAN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-11"
                    />
                </div>
            </div>

            <main className="p-4 pb-24">
                {loading ? (
                    <ClientListSkeleton />
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {search ? 'No clients found' : 'No clients yet'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                            {search
                                ? 'Try adjusting your search terms'
                                : 'Click "Add" button above to create your first client'
                            }
                        </p>
                        {!search && (
                            <Button asChild size="lg">
                                <Link href="/staff/clients/new">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Client
                                </Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredClients.map((client) => {
                            const activeLoan = client.loans?.[0]
                            const loanCount = client.loans?.length || 0

                            return (
                                <Card key={client.client_id} className="overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex gap-3 flex-1 min-w-0">
                                                <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                                                    {client.full_name.trim().charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">{client.full_name}</h3>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1 truncate">
                                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                                        {client.mobile_number}
                                                    </p>
                                                    {client.pan_number && (
                                                        <p className="text-xs text-gray-500 truncate mt-1">PAN: {client.pan_number}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                {activeLoan && (
                                                    <Badge
                                                        variant={activeLoan.status === 'Disbursed' ? 'default' : 'secondary'}
                                                        className="mb-1"
                                                    >
                                                        {activeLoan.status}
                                                    </Badge>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {loanCount} {loanCount === 1 ? 'loan' : 'loans'}
                                                </p>
                                            </div>
                                        </div>

                                        {activeLoan && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs text-gray-600">Latest Loan</p>
                                                    <p className="text-base font-bold text-gray-900">{formatCurrency(activeLoan.amount)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="mt-4 flex gap-2">
                                            {activeLoan ? (
                                                <Button asChild variant="default" size="sm" className="flex-1 h-10">
                                                    <Link href={`/staff/loans/${activeLoan.loan_id}`}>
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        View Loan
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button asChild variant="default" size="sm" className="flex-1 h-10">
                                                    <Link href="/staff/quotation">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        New Quote
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-10 w-10 p-0 border-gray-300 hover:bg-blue-50 hover:border-blue-600"
                                            >
                                                <Link href={`/staff/clients/${client.client_id}`}>
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-10 w-10 p-0 border-gray-300 hover:bg-blue-50 hover:border-blue-600"
                                                onClick={() => window.location.href = `tel:${client.mobile_number}`}
                                            >
                                                <Phone className="h-4 w-4 text-blue-600" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
