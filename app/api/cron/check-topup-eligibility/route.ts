import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { findEligibleLoans, wasRecentlyNotified } from '@/lib/topup-eligibility'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * Cron job to:
 * 1. Mark expired top-up offers as EXPIRED
 * 2. Detect loans that became eligible for top-up
 * 3. Create offers and notify the assigned agent + admins
 *
 * Schedule: Every Sunday at 2 AM (vercel.json)
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createAdminClient()

        // ── Step 1: Expire stale PENDING offers ──────────────────────────────
        const { data: expiredResult } = await supabase.rpc('mark_expired_topup_offers')
        const expiredCount = expiredResult ?? 0

        // ── Step 2: Find newly eligible loans ───────────────────────────────
        const eligibleLoans = await findEligibleLoans()

        const offersCreated: string[] = []
        const skippedDueToRecent: string[] = []

        // Get admin users to notify in bulk (one query, not one per offer)
        const { data: admins } = await supabase
            .from('app_users')
            .select('id')
            .in('role', ['ADMIN', 'MD'])

        // ── Step 3: Create offers and notify ────────────────────────────────
        for (const { loanId, clientId, eligibility } of eligibleLoans) {
            // Check notification frequency to prevent spamming the same loan
            const recentlyNotified = await wasRecentlyNotified(loanId, 30)
            if (recentlyNotified) {
                skippedDueToRecent.push(loanId)
                continue
            }

            // Fetch client + their onboarding agent in one query
            const { data: client } = await supabase
                .from('clients')
                .select('full_name, onboarding_agent_id')
                .eq('client_id', clientId)
                .single()

            const clientName = client?.full_name || 'Client'
            const formattedAmount = `₹${eligibility.maxAmount.toLocaleString('en-IN')}`

            // Resolve the assigned agent: use onboarding agent if active, else null
            let assignedAgentId: string | null = client?.onboarding_agent_id || null

            if (assignedAgentId) {
                const { data: agentUser } = await supabase
                    .from('app_users')
                    .select('id, status')
                    .eq('id', assignedAgentId)
                    .single()

                // If the original agent is inactive, unassign (Admins will handle it)
                if (!agentUser || agentUser.status === 'INACTIVE') {
                    assignedAgentId = null
                }
            }

            // Create the offer record with 30-day expiry
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 30)

            const { data: offer, error: offerError } = await supabase
                .from('topup_offers')
                .insert({
                    loan_id: loanId,
                    client_id: clientId,
                    offered_amount: eligibility.maxAmount,
                    eligibility_details: eligibility.details,
                    status: 'PENDING',
                    expires_at: expiresAt.toISOString(),
                    assigned_agent_id: assignedAgentId,
                })
                .select('offer_id')
                .single()

            if (offerError || !offer) {
                console.error(`Error creating offer for loan ${loanId}:`, offerError)
                continue
            }

            offersCreated.push(offer.offer_id)

            const offerLink = `/dashboard/topup/${offer.offer_id}`

            // Notify all admins/MDs
            if (admins && admins.length > 0) {
                for (const admin of admins) {
                    await createNotification({
                        userId: admin.id,
                        title: 'New Top-Up Opportunity',
                        message: `${clientName} qualifies for a top-up loan of ${formattedAmount}`,
                        type: 'SUCCESS',
                        entityType: 'topup_offer',
                        entityId: offer.offer_id,
                        linkUrl: offerLink,
                    })
                }
            }

            // Notify the assigned agent specifically (if active and different from admins)
            if (assignedAgentId) {
                await createNotification({
                    userId: assignedAgentId,
                    title: 'Top-Up Lead Assigned',
                    message: `Your client ${clientName} qualifies for a top-up of ${formattedAmount}. Follow up now!`,
                    type: 'SUCCESS',
                    entityType: 'topup_offer',
                    entityId: offer.offer_id,
                    linkUrl: `/staff/topup/${offer.offer_id}`,
                })
            }
        }

        console.log(`✅ Top-Up Cron Complete: ${offersCreated.length} offers created, ${expiredCount} expired, ${skippedDueToRecent.length} skipped`)

        return NextResponse.json({
            success: true,
            offersCreated: offersCreated.length,
            offersExpired: expiredCount,
            skippedDueToRecent: skippedDueToRecent.length,
            totalEligible: eligibleLoans.length,
            timestamp: new Date().toISOString(),
        })

    } catch (error) {
        console.error('Top-up detection cron error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
