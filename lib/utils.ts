import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Check if a quotation should be flagged as high value
 * Rule: Amount >= ₹10,00,000 (10 lakhs) requires admin approval
 */
export function isHighValueQuotation(amount: number, interestRate: number): boolean {
    return amount >= 1000000; // 10 lakhs and above = High Value
}

/**
 * Calculate EMI using reducing balance method
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
}

/**
 * Calculate total amount payable
 */
export function calculateTotalAmount(principal: number, annualRate: number, tenureMonths: number): number {
    const emi = calculateEMI(principal, annualRate, tenureMonths);
    return emi * tenureMonths;
}

/**
 * Format currency in Indian Rupee format
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date to Indian locale
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
