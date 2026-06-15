import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { findEligibleLoans, wasRecentlyNotified } from '@/lib/topup-eligibility'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * Cron job to detect top-up eligible loans and create offers
 * Runs weekly to find customers who qualify
 * 
 * Security: Protected by Vercel Cron Secret
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Find all eligible loans
        const eligibleLoans = await findEligibleLoans()

        const offersCreated: string[] = []
        const skippedDueToRecent: string[] = []

        // Get all admin users to notify them
        const { data: admins } = await supabase
            .from('app_users')
            .select('id')
            .eq('role', 'ADMIN')

        // Process each eligible loan
        for (const { loanId, clientId, eligibility } of eligibleLoans) {
            // Check if offer was recently sent (within 30 days)
            const recentlyNotified = await wasRecentlyNotified(loanId, 30)

            if (recentlyNotified) {
                skippedDueToRecent.push(loanId)
                continue
            }

            // Create top-up offer
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 30) // 30 days validity

            const { data: offer, error } = await supabase
                .from('topup_offers')
                .insert({
                    loan_id: loanId,
                    client_id: clientId,
                    offered_amount: eligibility.maxAmount,
                    eligibility_details: eligibility.details,
                    status: 'PENDING',
                    expires_at: expiresAt.toISOString()
                })
                .select('offer_id')
                .single()

            if (error) {
                console.error(`Error creating offer for loan ${loanId}:`, error)
                continue
            }

            offersCreated.push(offer.offer_id)

            // 1. Fetch client info and onboarding agent
            const { data: client } = await supabase
                .from('clients')
                .select('full_name, onboarding_agent_id')
                .eq('client_id', clientId)
                .single()

            const clientName = client?.full_name || 'Client'
            const formattedAmount = `₹${eligibility.maxAmount.toLocaleString('en-IN')}`

            // 2. Notify admins about new top-up opportunity
            if (admins && admins.length > 0) {
                for (const admin of admins) {
                    await createNotification({
                        userId: admin.id,
                        title: 'New Top-Up Opportunity',
                        message: `${clientName} qualifies for a top-up loan of ${formattedAmount}`,
                        type: 'SUCCESS',
                        entityType: 'topup_offer',
                        entityId: offer.offer_id,
                        linkUrl: `/dashboard/topup/${offer.offer_id}`
                    })
                }
            }

            // 3. Notify onboarding agent specifically
            if (client?.onboarding_agent_id) {
                await createNotification({
                    userId: client.onboarding_agent_id,
                    title: 'Top-Up Offer Available',
                    message: `Your client ${clientName} qualifies for a top-up of ${formattedAmount}`,
                    type: 'SUCCESS',
                    entityType: 'topup_offer',
                    entityId: offer.offer_id,
                    linkUrl: `/dashboard/topup/${offer.offer_id}`
                })
            }
        }

        console.log(`✅ Top-Up Detection Complete: ${offersCreated.length} new offers created`)
        console.log(`⏭️  Skipped ${skippedDueToRecent.length} due to recent notifications`)

        return NextResponse.json({
            success: true,
            offersCreated: offersCreated.length,
            skippedDueToRecent: skippedDueToRecent.length,
            totalEligible: eligibleLoans.length,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Top-up detection cron error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
