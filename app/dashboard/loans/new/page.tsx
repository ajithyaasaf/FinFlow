'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CreateLoanForm } from '@/components/dashboard/create-loan-form'
import { createClient } from '@/lib/supabase/client'
import type { Client, AppUser } from '@/types'

export default function NewLoanPage() {
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<Client[]>([])
    const [partners, setPartners] = useState<any[]>([])
    const [allStaff, setAllStaff] = useState<AppUser[]>([])

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
                <p className="text-sm text-gray-500 font-medium font-sans">Loading page details...</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href="/dashboard/loans">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Create Loan</h1>
                    <p className="text-xs md:text-sm text-gray-500">Create a loan application for an existing client</p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-800">Loan Application Process</p>
                            <p className="text-blue-600 mt-1">
                                Select a client and enter loan terms. Choose between Direct Lending or Brokerage Submission models.
                                For Brokerage, select the Bank/NBFC, Region, and optionally assign a Team Leader.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form */}
            <CreateLoanForm clients={clients} partners={partners} allStaff={allStaff} />
        </div>
    )
}
