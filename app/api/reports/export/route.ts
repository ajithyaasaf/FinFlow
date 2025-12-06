import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const supabase = await createClient()

    let query = supabase
        .from('quotations')
        .select(`
            *,
            client:clients(full_name, mobile_number),
            agent:app_users(full_name)
        `)
        .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert to CSV
    const csvHeader = ['Date', 'Client Name', 'Mobile', 'Agent', 'Amount', 'Interest Rate', 'Tenure', 'High Value'].join(',')
    const csvRows = data.map(row => [
        new Date(row.created_at).toLocaleDateString(),
        `"${row.client?.full_name || ''}"`,
        row.client?.mobile_number || '',
        `"${row.agent?.full_name || ''}"`,
        row.amount,
        row.interest_rate,
        row.tenure,
        row.is_high_value ? 'Yes' : 'No'
    ].join(','))

    const csvContent = [csvHeader, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="report.csv"',
        },
    })
}
