import { createClient } from './supabase/client'

/**
 * Upload a file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param path - Path within bucket (without filename)
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
    file: File,
    bucket: string,
    path: string
): Promise<string> {
    const supabase = createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${path}/${fileName}`

    try {
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            throw uploadError
        }

        // Get public URL
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return data.publicUrl
    } catch (error) {
        console.error('Upload error:', error)
        throw new Error('Failed to upload file')
    }
}

/**
 * Upload KYC document
 */
export async function uploadKYC(file: File): Promise<string> {
    return uploadFile(file, 'documents', 'kyc')
}

/**
 * Upload selfie for attendance
 */
export async function uploadSelfie(file: File): Promise<string> {
    return uploadFile(file, 'documents', 'attendance')
}

/**
 * Upload quotation PDF
 */
export async function uploadQuotationPDF(file: Blob, quotationId: string): Promise<string> {
    const supabase = createClient()
    const filePath = `quotations/${quotationId}.pdf`

    try {
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file, {
                contentType: 'application/pdf',
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            throw uploadError
        }

        const { data } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath)

        return data.publicUrl
    } catch (error) {
        console.error('PDF upload error:', error)
        throw new Error('Failed to upload PDF')
    }
}
