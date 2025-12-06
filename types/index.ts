// Database Types matching Supabase Schema

export type UserRole = 'ADMIN' | 'AGENT';

export type LoanProcessStage =
    | 'Application Submitted'
    | 'Document Verification'
    | 'Credit Appraisal'
    | 'Sanction'
    | 'Agreement Signed'
    | 'Disbursement Ready'
    | 'Disbursed';

export interface AppUser {
    id: string;
    role: UserRole;
    full_name: string;
    mobile_number: string;
    email: string;
    created_at: string;
}

export interface Client {
    client_id: string;
    full_name: string;
    mobile_number: string;
    pan_number?: string;
    kyc_document_url: string | null;
    onboarding_agent_id: string;
    created_at: string;
}

export interface LoanApplication {
    loan_id: string;
    client_id: string;
    amount: number;
    interest_rate: number;
    tenure: number;
    original_amount?: number | null;
    original_rate?: number | null;
    original_tenure?: number | null;
    process_stage: string;
    rejection_reason?: string | null;
    disbursement_date?: string | null;
    disbursement_reference?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CheckInDetails {
    lat: number;
    lng: number;
    selfie_url: string;
}

export interface AttendanceLog {
    log_id: string;
    agent_id: string;
    check_in_time: string;
    check_in_details: CheckInDetails;
}

export interface Quotation {
    quote_id: string;
    client_id: string;
    amount: number;
    interest_rate: number;
    tenure: number;
    final_amount: number;
    is_high_value: boolean;
    pdf_document_url: string | null;
    converted_to_loan_id?: string | null;
    created_by: string;
    created_at: string;
}

// Extended types with relations
export interface QuotationWithClient extends Quotation {
    client: Client;
}

export interface LoanApplicationWithClient extends LoanApplication {
    client: Client;
}

export interface AttendanceLogWithAgent extends AttendanceLog {
    agent: AppUser;
}

export interface SystemLog {
    log_id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_value?: any;
    new_value?: any;
    created_at: string;
}

// ============================================================================
// EMI PAYMENT SYSTEM TYPES
// ============================================================================

export type EMIStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'

export interface EMISchedule {
    schedule_id: string
    loan_id: string
    emi_number: number
    due_date: string
    emi_amount: number
    principal_component: number
    interest_component: number
    outstanding_principal: number
    status: EMIStatus
    paid_date: string | null
    paid_amount: number
    late_fee: number
    created_at: string
    updated_at: string
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'IMPS'

export interface Payment {
    payment_id: string
    loan_id: string
    schedule_id: string | null
    amount: number
    payment_date: string
    payment_method: PaymentMethod
    reference_number: string | null
    collected_by: string | null
    notes: string | null
    created_at: string
}

export interface SystemSettings {
    setting_key: string
    setting_value: Record<string, any>
    description: string | null
    updated_at: string
    updated_by: string | null
}

export interface LateFeeConfig {
    days_grace: number
    fee_percentage: number
    min_fee: number
    max_fee: number
}

export interface TopUpRules {
    min_emis_paid: number
    min_principal_repaid_pct: number
    max_topup_multiplier: number
    notification_frequency_days: number
}

export type TopUpOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface TopUpOffer {
    offer_id: string
    loan_id: string
    client_id: string
    offered_amount: number
    eligibility_details: {
        emisPaid: number
        missedPayments: number
        principalRepaid: number
        repaidPercentage: number
    }
    status: TopUpOfferStatus
    offered_at: string
    expires_at: string | null
    accepted_at: string | null
    rejected_at: string | null
    rejection_reason: string | null
    created_at: string
    updated_at: string
}

export interface LoanPaymentSummary {
    loan_id: string
    client_id: string
    loan_amount: number
    process_stage: string
    disbursement_date: string | null
    total_emis: number
    paid_emis: number
    overdue_emis: number
    pending_emis: number
    principal_paid: number
    outstanding_principal: number
    next_due_date: string | null
}
