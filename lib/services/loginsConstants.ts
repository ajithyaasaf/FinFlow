import type { LoanApplication, Client, AppUser, BankPartner } from '@/types'

export const LOGINS_STAGES = [
    'Login',
    'PD Initiation',
    'Technical Visit',
    'Legal Verification',
    'MOD',
    'Sanctioned',
    'Disbursed',
    'Declined',
    'Relook',
    'Spill Over',
    'Documents Pending',
] as const

export type LoginsStage = typeof LOGINS_STAGES[number]

export const STAGE_COLORS: Record<string, string> = {
    'Login':              'bg-blue-100 text-blue-800 border-blue-200',
    'PD Initiation':      'bg-violet-100 text-violet-800 border-violet-200',
    'Technical Visit':    'bg-amber-100 text-amber-800 border-amber-200',
    'Legal Verification': 'bg-orange-100 text-orange-800 border-orange-200',
    'MOD':                'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Sanctioned':         'bg-teal-100 text-teal-800 border-teal-200',
    'Disbursed':          'bg-green-100 text-green-800 border-green-200',
    'Declined':           'bg-red-100 text-red-800 border-red-200',
    'Relook':             'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Spill Over':         'bg-pink-100 text-pink-800 border-pink-200',
    'Documents Pending':  'bg-gray-100 text-gray-700 border-gray-200',
    // Legacy
    'Application Submitted': 'bg-slate-100 text-slate-700 border-slate-200',
    'Document Verification': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Credit Appraisal':      'bg-purple-100 text-purple-700 border-purple-200',
    'Sanction':              'bg-teal-100 text-teal-800 border-teal-200',
    'Agreement Signed':      'bg-green-100 text-green-700 border-green-200',
    'Disbursement Ready':    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Closed':                'bg-gray-200 text-gray-600 border-gray-300',
}

export const REGIONS = ['Madurai', 'Tenkasi'] as const
export type Region = typeof REGIONS[number]

export interface LoginWithRelations extends LoanApplication {
    client: Client
    onboarding_agent: AppUser | null
    bank_partner: BankPartner | null
    assigned_tl: AppUser | null
}

export interface LoginsStats {
    stageCounts: Record<string, number>
    totalDisbursedAmount: number
    totalSanctionedAmount: number
    totalDisbursedNew: number
    totalDisbursedRepeat: number
    totalSpillOver: number
}
