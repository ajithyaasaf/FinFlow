import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { CreateLoanForm } from '@/components/dashboard/create-loan-form'
import type { Client } from '@/types'

export const dynamic = 'force-dynamic'

async function getClients(): Promise<Client[]> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('clients')
        .select('*')
        .order('full_name')

    return (data || []) as Client[]
}

export default async function NewLoanPage() {
    const clients = await getClients()

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
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Create New Loan</h1>
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
                                Select a client and enter loan terms. The loan will start in "Application Submitted"
                                stage and proceed through verification stages before disbursement.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form */}
            <CreateLoanForm clients={clients} />
        </div>
    )
}
