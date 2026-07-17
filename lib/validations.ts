import { z } from 'zod'

// ============================================================================
// FORM VALIDATION SCHEMAS
// ============================================================================

export const clientSchema = z.object({
    full_name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and dots'),

    mobile_number: z.string()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),

    kyc_document: z.instanceof(File)
        .optional()
        .refine(
            (file) => !file || file.size <= 5 * 1024 * 1024,
            'File size must be less than 5MB'
        )
        .refine(
            (file) => !file || ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
            'File must be PDF, JPEG, or PNG'
        ),
})

export const quotationSchema = z.object({
    client_id: z.string().uuid('Please select a client'),

    amount: z.number()
        .min(10000, 'Loan amount must be at least ₹10,000')
        .max(10000000, 'Loan amount cannot exceed ₹1,00,00,000'),

    interest_rate: z.number()
        .min(1, 'Interest rate must be at least 1%')
        .max(36, 'Interest rate cannot exceed 36% (legal limit)'),

    tenure: z.number()
        .int('Tenure must be a whole number')
        .min(1, 'Tenure must be at least 1 month')
        .max(360, 'Tenure cannot exceed 360 months (30 years)'),
})

export const attendanceSchema = z.object({
    latitude: z.number()
        .min(-90, 'Invalid latitude')
        .max(90, 'Invalid latitude'),

    longitude: z.number()
        .min(-180, 'Invalid longitude')
        .max(180, 'Invalid longitude'),

    selfie: z.instanceof(File)
        .optional()
        .refine(
            (file) => !file || file.size <= 5 * 1024 * 1024,
            'Selfie size must be less than 5MB'
        )
        .refine(
            (file) => !file || ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
            'Selfie must be JPEG or PNG'
        ),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ClientFormData = z.infer<typeof clientSchema>
export type QuotationFormData = z.infer<typeof quotationSchema>
export type AttendanceFormData = z.infer<typeof attendanceSchema>
