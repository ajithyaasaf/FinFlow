/**
 * EMI Calculation and Schedule Generation Utilities
 * 
 * Best practices:
 * - Pure functions for testability
 * - Type-safe interfaces
 * - Precise decimal handling using built-in Number
 * - Comprehensive validation
 */

export interface EMIScheduleItem {
    emiNumber: number
    dueDate: Date
    emiAmount: number
    principalComponent: number
    interestComponent: number
    outstandingPrincipal: number
}

export interface LateFeeConfig {
    days_grace: number
    fee_percentage: number
    min_fee: number
    max_fee: number
}

export interface EMICalculationParams {
    loanAmount: number
    annualInterestRate: number
    tenureMonths: number
}

/**
 * Calculate monthly EMI using reducing balance method
 * Formula: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 * where P = Principal, r = Monthly interest rate, n = Number of months
 */
export function calculateEMI(
    loanAmount: number,
    annualInterestRate: number,
    tenureMonths: number
): number {
    if (loanAmount <= 0 || annualInterestRate < 0 || tenureMonths <= 0) {
        throw new Error('Invalid EMI calculation parameters')
    }

    const monthlyRate = annualInterestRate / 12 / 100

    // Handle edge case: 0% interest
    if (monthlyRate === 0) {
        return loanAmount / tenureMonths
    }

    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1

    return Math.round((numerator / denominator) * 100) / 100
}

/**
 * Generate complete EMI amortization schedule
 * Returns array of EMI breakdowns with principal/interest components
 */
export function generateEMISchedule(
    loanAmount: number,
    annualInterestRate: number,
    tenureMonths: number,
    disbursementDate: Date
): EMIScheduleItem[] {
    if (loanAmount <= 0 || annualInterestRate < 0 || tenureMonths <= 0) {
        throw new Error('Invalid schedule generation parameters')
    }

    const emi = calculateEMI(loanAmount, annualInterestRate, tenureMonths)
    const monthlyRate = annualInterestRate / 12 / 100

    let outstandingPrincipal = loanAmount
    const schedule: EMIScheduleItem[] = []

    for (let i = 1; i <= tenureMonths; i++) {
        // Calculate interest on outstanding principal
        const interestComponent = outstandingPrincipal * monthlyRate

        // Principal = EMI - Interest
        let principalComponent = emi - interestComponent

        // For last EMI, adjust to clear remaining balance
        if (i === tenureMonths) {
            principalComponent = outstandingPrincipal
        }

        outstandingPrincipal -= principalComponent

        // Calculate due date (add months to disbursement date)
        const dueDate = new Date(disbursementDate)
        dueDate.setMonth(dueDate.getMonth() + i)

        // Handle month-end edge cases (e.g., Jan 31 -> Feb 28)
        if (dueDate.getDate() !== disbursementDate.getDate()) {
            dueDate.setDate(0) // Set to last day of previous month
        }

        schedule.push({
            emiNumber: i,
            dueDate,
            emiAmount: i === tenureMonths ? interestComponent + principalComponent : emi,
            principalComponent: Math.round(principalComponent * 100) / 100,
            interestComponent: Math.round(interestComponent * 100) / 100,
            outstandingPrincipal: Math.max(0, Math.round(outstandingPrincipal * 100) / 100)
        })
    }

    return schedule
}

/**
 * Calculate late fee based on delay and configuration
 * Applies grace period, percentage fee, and min/max limits
 */
export function calculateLateFee(
    dueDate: Date,
    paidDate: Date,
    emiAmount: number,
    config: LateFeeConfig
): number {
    // Normalize dates to start of day for accurate comparison
    const dueDateNormalized = new Date(dueDate)
    dueDateNormalized.setHours(0, 0, 0, 0)

    const paidDateNormalized = new Date(paidDate)
    paidDateNormalized.setHours(0, 0, 0, 0)

    const diffTime = paidDateNormalized.getTime() - dueDateNormalized.getTime()
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // No late fee if within grace period or paid early
    if (daysDiff <= config.days_grace) {
        return 0
    }

    // Calculate percentage-based late fee
    const lateFee = (emiAmount * config.fee_percentage) / 100

    // Apply min/max limits
    return Math.min(Math.max(lateFee, config.min_fee), config.max_fee)
}

/**
 * Calculate total payment summary for a loan
 */
export interface PaymentSummary {
    totalEMIs: number
    paidEMIs: number
    pendingEMIs: number
    overdueEMIs: number
    principalPaid: number
    principalOutstanding: number
    totalInterestPaid: number
    totalLateFees: number
    nextDueDate: Date | null
    nextDueAmount: number
}

/**
 * Validate EMI payment amount
 * Ensures payment is within acceptable range
 */
export function validatePaymentAmount(
    paymentAmount: number,
    emiAmount: number,
    allowPartial: boolean = false
): { valid: boolean; error?: string } {
    if (paymentAmount <= 0) {
        return { valid: false, error: 'Payment amount must be greater than zero' }
    }

    if (!allowPartial && paymentAmount < emiAmount) {
        return {
            valid: false,
            error: `Partial payments not allowed. Minimum amount: ₹${emiAmount}`
        }
    }

    if (paymentAmount > emiAmount * 1.5) {
        return {
            valid: false,
            error: `Payment amount too high. Maximum: ₹${emiAmount * 1.5}`
        }
    }

    return { valid: true }
}

/**
 * Calculate prepayment impact
 * Shows how extra payment affects loan tenure and interest
 */
export interface PrepaymentImpact {
    originalTenure: number
    newTenure: number
    tenureSaved: number
    originalTotalInterest: number
    newTotalInterest: number
    interestSaved: number
}

export function calculatePrepaymentImpact(
    outstandingPrincipal: number,
    emiAmount: number,
    prepaymentAmount: number,
    annualInterestRate: number,
    remainingTenure: number
): PrepaymentImpact {
    const monthlyRate = annualInterestRate / 12 / 100

    // Calculate current total interest
    const originalTotalPayment = emiAmount * remainingTenure
    const originalTotalInterest = originalTotalPayment - outstandingPrincipal

    // Calculate new outstanding after prepayment
    const newOutstanding = outstandingPrincipal - prepaymentAmount

    // Calculate new tenure with same EMI
    let newTenure = 0
    let balance = newOutstanding

    while (balance > 0 && newTenure < remainingTenure) {
        const interest = balance * monthlyRate
        const principal = emiAmount - interest
        balance -= principal
        newTenure++
    }

    const newTotalPayment = emiAmount * newTenure
    const newTotalInterest = newTotalPayment - newOutstanding

    return {
        originalTenure: remainingTenure,
        newTenure,
        tenureSaved: remainingTenure - newTenure,
        originalTotalInterest: Math.round(originalTotalInterest * 100) / 100,
        newTotalInterest: Math.round(newTotalInterest * 100) / 100,
        interestSaved: Math.round((originalTotalInterest - newTotalInterest) * 100) / 100
    }
}
