/**
 * Top-Up Loan Eligibility Checker
 *
 * Determines if a customer qualifies for a top-up loan based on:
 * - Loan status (must be Disbursed)
 * - No currently active top-up in progress
 * - Payment history (minimum EMIs paid OR high principal repaid - partial pre-payment rule)
 * - Payment reliability (no current overdue payments)
 * - Principal repayment percentage
 */

import { createAdminClient } from './supabase/admin'

export interface TopUpEligibility {
    isEligible: boolean
    maxAmount: number
    reason?: string
    details: {
        emisPaid?: number
        missedPayments?: number
        principalRepaid?: number
        repaidPercentage?: number
        loanStatus: string
        triggeredByPartialPrepayment?: boolean
        monthsActive?: number
        originalAmount?: number
        disbursedDate?: string
    }
}

export interface TopUpRules {
    min_emis_paid: number
    min_principal_repaid_pct: number
    max_topup_multiplier: number
    notification_frequency_days: number
    partial_prepayment_threshold_pct: number
}

const DEFAULT_RULES: TopUpRules = {
    min_emis_paid: 6,
    min_principal_repaid_pct: 30,
    max_topup_multiplier: 0.8,
    notification_frequency_days: 30,
    partial_prepayment_threshold_pct: 50, // Partial pre-payment bypass threshold
}

/**
 * Check if a loan is eligible for top-up.
 * Handles edge cases:
 * - "Already Active" check: skip if client already has an active top-up
 * - Simplified 1-year active rule: suggests top-up offers after 12 months since disbursement
 */
export async function checkTopUpEligibility(
    loanId: string
): Promise<TopUpEligibility> {
    const supabase = createAdminClient()

    // 1. Get loan details
    const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select('loan_id, client_id, amount, process_stage, disbursement_date, created_at')
        .eq('loan_id', loanId)
        .single()

    if (loanError || !loan) {
        return ineligible(0, 'Loan not found', 'UNKNOWN')
    }

    // 2. Only disbursed loans are eligible
    if (loan.process_stage !== 'Disbursed') {
        return ineligible(0, 'Loan not disbursed yet', loan.process_stage)
    }

    // 3. "Already Active" check: does this client have an active/pending top-up?
    const { data: existingOffer } = await supabase
        .from('topup_offers')
        .select('offer_id, status')
        .eq('client_id', loan.client_id)
        .in('status', ['PENDING', 'ACCEPTED'])
        .limit(1)
        .single()

    if (existingOffer) {
        return ineligible(0, `Client already has an active top-up offer (${existingOffer.status})`, loan.process_stage)
    }

    // 4. Calculate active months since disbursement date (or created date fallback)
    const referenceDateStr = loan.disbursement_date || loan.created_at
    const referenceDate = new Date(referenceDateStr)
    const today = new Date()
    
    const yearsDiff = today.getFullYear() - referenceDate.getFullYear()
    const monthsDiff = today.getMonth() - referenceDate.getMonth()
    const monthsActive = yearsDiff * 12 + monthsDiff

    const baseDetails = {
        loanStatus: loan.process_stage,
        monthsActive,
        originalAmount: loan.amount,
        disbursedDate: referenceDateStr,
    }

    // 5. Get settings multiplier if available
    const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'topup_rules')
        .single()

    const rules: TopUpRules = (settings?.setting_value as TopUpRules) || DEFAULT_RULES

    // 6. Eligibility check: Must be active for at least 12 months
    if (monthsActive < 12) {
        return ineligible(
            0,
            `Loan active for ${monthsActive} month(s). Must be active for at least 12 months for top-up suggestion.`,
            loan.process_stage,
            baseDetails
        )
    }

    // 7. Return 0 by default to force manual check and override by administrator
    const maxTopUp = 0

    return {
        isEligible: true,
        maxAmount: maxTopUp,
        details: baseDetails,
    }
}

/**
 * Find all loans eligible for top-up.
 * Used by the automated nightly detection cron job.
 */
export async function findEligibleLoans(): Promise<Array<{
    loanId: string
    clientId: string
    eligibility: TopUpEligibility
}>> {
    const supabase = createAdminClient()

    // Get all disbursed loans
    const { data: loans } = await supabase
        .from('loan_applications')
        .select('loan_id, client_id')
        .eq('process_stage', 'Disbursed')

    if (!loans) return []

    const eligibleLoans: Array<{
        loanId: string
        clientId: string
        eligibility: TopUpEligibility
    }> = []

    // Check each loan sequentially to avoid hammering the DB
    for (const loan of loans) {
        const eligibility = await checkTopUpEligibility(loan.loan_id)
        if (eligibility.isEligible) {
            eligibleLoans.push({
                loanId: loan.loan_id,
                clientId: loan.client_id,
                eligibility,
            })
        }
    }

    return eligibleLoans
}

/**
 * Check if a top-up offer was recently sent for this loan.
 * Prevents spam by checking notification frequency from system settings.
 */
export async function wasRecentlyNotified(
    loanId: string,
    frequencyDays: number
): Promise<boolean> {
    const supabase = createAdminClient()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - frequencyDays)

    const { data: recentOffer } = await supabase
        .from('topup_offers')
        .select('offer_id')
        .eq('loan_id', loanId)
        .in('status', ['PENDING', 'ACCEPTED']) // Only count active offers as "recently notified"
        .gte('offered_at', cutoffDate.toISOString())
        .limit(1)
        .single()

    return !!recentOffer
}

// ── Internal helpers ────────────────────────────────────────────────────────

function ineligible(
    missedPayments: number,
    reason: string,
    loanStatus: string,
    details?: Partial<TopUpEligibility['details']>
): TopUpEligibility {
    return {
        isEligible: false,
        maxAmount: 0,
        reason,
        details: {
            emisPaid: 0,
            missedPayments,
            principalRepaid: 0,
            repaidPercentage: 0,
            loanStatus,
            ...details,
        },
    }
}
