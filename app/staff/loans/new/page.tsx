'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Loader2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { CreateLoanForm } from '@/components/dashboard/create-loan-form'
import { createClient } from '@/lib/supabase/client'
import type { Client, AppUser } from '@/types'
import { Suspense } from 'react'
import { PageHeader } from '@/components/agent/page-header'

function NewStaffLoanPageContent() {
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<Client[]>([])
    const [partners, setPartners] = useState<any[]>([])
    const [allStaff, setAllStaff] = useState<AppUser[]>([])

    // Read top-up pre-fill params from query string (set by TopUpActions on conversion)
    const topupContext = {
        clientId: searchParams.get('client_id') || '',
        topupOfferId: searchParams.get('topup_offer_id') || '',
        maxAmount: searchParams.get('max_amount') || '',
        disbursementType: searchParams.get('disbursement_type') || 'New',
        originalLoanId: searchParams.get('original_loan_id') || '',
    }
    const isTopUpFlow = !!topupContext.topupOfferId

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const supabase = createClient()
                const [clientsRes, partnersRes, staffRes] = await Promise.all([
                    supabase.from('clients').select('*').order('full_name'),
                    supabase.from('bank_partners').select('*').order('bank_name'),
                    supabase.from('app_users').select('*').order('full_name'),
                ])
                setClients((clientsRes.data || []) as Client[])
                setPartners(partnersRes.data || [])
                setAllStaff((staffRes.data || []) as AppUser[])
            } catch (err) {
                console.error('Failed to load new loan metadata:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Loading details...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <PageHeader
                title={isTopUpFlow ? 'Top-Up Loan Application' : 'Create Loan'}
                subtitle={
                    isTopUpFlow
                        ? 'Pre-filled from the approved top-up offer. Review and submit.'
                        : 'Create a loan application for an existing client'
                }
                backHref={isTopUpFlow ? '/staff/topup' : '/staff/clients'}
            />

            <main className="p-4 space-y-4 max-w-4xl mx-auto">
                {/* Top-Up Banner */}
                {isTopUpFlow && (
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-green-800">Top-Up Conversion Flow</p>
                                    <p className="text-green-700 mt-1">
                                        This form is pre-filled from an approved top-up offer.
                                        The loan is locked as a <strong>Repeat (Top-Up)</strong> disbursement.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Create Form */}
                <CreateLoanForm
                    clients={clients}
                    partners={partners}
                    allStaff={allStaff}
                    topupContext={isTopUpFlow ? topupContext : undefined}
                />
            </main>
        </div>
    )
}

export default function StaffNewLoanPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Loading page components...</p>
            </div>
        }>
            <NewStaffLoanPageContent />
        </Suspense>
    )
}
