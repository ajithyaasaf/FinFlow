import { createClient } from './supabase/client'

/**
 * Compress images client-side before upload to reduce size and improve speed on field networks
 */
async function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.75): Promise<Blob | File> {
    // Return original file if not an image or if running on server-side
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
        return file
    }

    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width)
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height)
                        height = maxHeight
                    }
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        resolve(blob || file)
                    },
                    'image/jpeg',
                    quality
                )
            }
            img.onerror = () => resolve(file)
        }
        reader.onerror = () => resolve(file)
    })
}

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

    // Compress the image before uploading if applicable
    const isImage = file.type.startsWith('image/')
    const uploadBody = isImage ? await compressImage(file) : file

    // Generate unique filename (change extension to jpg if it was compressed)
    const originalExt = file.name.split('.').pop()
    const fileExt = isImage ? 'jpg' : originalExt
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${path}/${fileName}`

    try {
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, uploadBody, {
                cacheControl: '3600',
                upsert: false,
                contentType: isImage ? 'image/jpeg' : file.type
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
