export interface AmortizationRow {
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
}

export function calculateAmortizationSchedule(
    principal: number,
    rate: number,
    tenure: number
): AmortizationRow[] {
    const monthlyRate = rate / 12 / 100
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1)

    let balance = principal
    const schedule: AmortizationRow[] = []

    for (let i = 1; i <= tenure; i++) {
        const interest = balance * monthlyRate
        const principalComponent = emi - interest
        balance = balance - principalComponent

        schedule.push({
            month: i,
            payment: Math.round(emi),
            principal: Math.round(principalComponent),
            interest: Math.round(interest),
            balance: Math.max(0, Math.round(balance))
        })
    }

    return schedule
}
