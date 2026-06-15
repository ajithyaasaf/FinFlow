/**
 * Top-Up Loan Eligibility Checker
 * 
 * Determines if a customer qualifies for a top-up loan based on:
 * - Payment history (minimum EMIs paid)
 * - Payment reliability (no missed payments)
 * - Principal repayment percentage
 * - Loan status
 */

import { createAdminClient } from './supabase/admin'

export interface TopUpEligibility {
    isEligible: boolean
    maxAmount: number
    reason?: string
    details: {
        emisPaid: number
        missedPayments: number
        principalRepaid: number
        repaidPercentage: number
        loanStatus: string
    }
}

export interface TopUpRules {
    min_emis_paid: number
    min_principal_repaid_pct: number
    max_topup_multiplier: number
    notification_frequency_days: number
}

/**
 * Check if a loan is eligible for top-up
 * Returns detailed eligibility information
 */
export async function checkTopUpEligibility(
    loanId: string
): Promise<TopUpEligibility> {
    const supabase = createAdminClient()

    // 1. Get loan details
    const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select('amount, process_stage')
        .eq('loan_id', loanId)
        .single()

    if (loanError || !loan) {
        return {
            isEligible: false,
            maxAmount: 0,
            reason: 'Loan not found',
            details: {
                emisPaid: 0,
                missedPayments: 0,
                principalRepaid: 0,
                repaidPercentage: 0,
                loanStatus: 'UNKNOWN'
            }
        }
    }

    // 2. Only disbursed loans are eligible
    if (loan.process_stage !== 'Disbursed') {
        return {
            isEligible: false,
            maxAmount: 0,
            reason: 'Loan not disbursed yet',
            details: {
                emisPaid: 0,
                missedPayments: 0,
                principalRepaid: 0,
                repaidPercentage: 0,
                loanStatus: loan.process_stage
            }
        }
    }

    // 3. Get EMI schedule and payment history
    const { data: schedule } = await supabase
        .from('emi_schedule')
        .select('*')
        .eq('loan_id', loanId)
        .order('emi_number', { ascending: true })

    if (!schedule || schedule.length === 0) {
        return {
            isEligible: false,
            maxAmount: 0,
            reason: 'No EMI schedule found',
            details: {
                emisPaid: 0,
                missedPayments: 0,
                principalRepaid: 0,
                repaidPercentage: 0,
                loanStatus: loan.process_stage
            }
        }
    }

    // 4. Get top-up rules from settings
    const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'topup_rules')
        .single()

    const rules: TopUpRules = settings?.setting_value as TopUpRules || {
        min_emis_paid: 6,
        min_principal_repaid_pct: 30,
        max_topup_multiplier: 0.8,
        notification_frequency_days: 30
    }

    // 5. Calculate payment statistics
    const paidEMIs = schedule.filter(s => s.status === 'PAID')
    const overdueEMIs = schedule.filter(s => s.status === 'OVERDUE')
    const missedCount = overdueEMIs.length

    const principalRepaid = paidEMIs.reduce((sum, emi) => sum + emi.principal_component, 0)
    const repaidPercentage = (principalRepaid / loan.amount) * 100

    // 6. Check eligibility criteria

    // Rule 1: Minimum EMIs paid
    if (paidEMIs.length < rules.min_emis_paid) {
        return {
            isEligible: false,
            maxAmount: 0,
            reason: `Minimum ${rules.min_emis_paid} EMIs required (currently ${paidEMIs.length})`,
            details: {
                emisPaid: paidEMIs.length,
                missedPayments: missedCount,
                principalRepaid,
                repaidPercentage,
                loanStatus: loan.process_stage
            }
        }
    }

    // Rule 2: No missed payments
    if (missedCount > 0) {
        return {
            isEligible: false,
            maxAmount: 0,
            reason: `${missedCount} overdue payment(s) must be cleared first`,
            details: {
                emisPaid: paidEMIs.length,
                missedPayments: missedCount,
                principalRepaid,
                repaidPercentage,
                loanStatus: loan.process_stage
            }
        }
    }

    // Rule 3: Minimum principal repaid percentage
    if (repaidPercentage < rules.min_principal_repaid_pct) {
        return {
            isEligible: false,
            maxAmount: 0,
            reason: `At least ${rules.min_principal_repaid_pct}% principal must be repaid (currently ${repaidPercentage.toFixed(1)}%)`,
            details: {
                emisPaid: paidEMIs.length,
                missedPayments: missedCount,
                principalRepaid,
                repaidPercentage,
                loanStatus: loan.process_stage
            }
        }
    }

    // 7. Calculate maximum top-up amount
    // Based on principal already repaid
    const maxTopUp = Math.floor(principalRepaid * rules.max_topup_multiplier)

    return {
        isEligible: true,
        maxAmount: maxTopUp,
        details: {
            emisPaid: paidEMIs.length,
            missedPayments: missedCount,
            principalRepaid,
            repaidPercentage,
            loanStatus: loan.process_stage
        }
    }
}

/**
 * Find all loans eligible for top-up
 * Used by automated detection system
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

    // Check each loan
    for (const loan of loans) {
        const eligibility = await checkTopUpEligibility(loan.loan_id)

        if (eligibility.isEligible) {
            eligibleLoans.push({
                loanId: loan.loan_id,
                clientId: loan.client_id,
                eligibility
            })
        }
    }

    return eligibleLoans
}

/**
 * Check if a top-up offer was recently sent
 * Prevents spam by checking notification frequency
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
        .gte('offered_at', cutoffDate.toISOString())
        .limit(1)
        .single()

    return !!recentOffer
}
