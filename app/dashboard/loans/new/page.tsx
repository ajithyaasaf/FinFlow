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

function NewLoanPageContent() {
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
                <p className="text-sm text-gray-500 font-medium">Loading page details...</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href={isTopUpFlow ? '/dashboard/topup' : '/dashboard/loans'}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        {isTopUpFlow ? 'Top-Up Loan Application' : 'Create Loan'}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500">
                        {isTopUpFlow
                            ? 'Pre-filled from the approved top-up offer. Review and submit.'
                            : 'Create a loan application for an existing client'}
                    </p>
                </div>
            </div>

            {/* Top-Up Banner */}
            {isTopUpFlow && (
                <Card className="mb-6 bg-green-50 border-green-200">
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

            {/* Standard Info Card */}
            {!isTopUpFlow && (
                <Card className="mb-6 bg-primary/5 border-primary/10">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-primary mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-primary">Loan Application Process</p>
                                <p className="text-primary/80 mt-1">
                                    Select a client and enter loan terms. Choose between Direct Lending or Brokerage Submission models.
                                    For Brokerage, select the Bank/NBFC, Region, and optionally assign a Team Leader.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Form */}
            <CreateLoanForm
                clients={clients}
                partners={partners}
                allStaff={allStaff}
                topupContext={isTopUpFlow ? topupContext : undefined}
            />
        </div>
    )
}

export default function NewLoanPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        }>
            <NewLoanPageContent />
        </Suspense>
    )
}
