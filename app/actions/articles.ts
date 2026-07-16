'use server'

import { createArticle, updateArticle, deleteArticle } from '@/lib/services/articleService'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { KnowledgeArticle } from '@/types'

async function verifyAdmin(supabase: any, userId: string) {
    const { data: profile } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single()
    if (!profile || !['ADMIN', 'MD'].includes(profile.role)) {
        throw new Error('Forbidden: Admin/MD access required')
    }
}

export async function createArticleAction(articleData: Partial<KnowledgeArticle>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        await verifyAdmin(supabase, user.id)
        const article = await createArticle(articleData)
        revalidatePath('/dashboard/wiki')
        revalidatePath('/agent/wiki')
        return { success: true, article }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create article' }
    }
}

export async function updateArticleAction(articleId: string, articleData: Partial<KnowledgeArticle>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        await verifyAdmin(supabase, user.id)
        const article = await updateArticle(articleId, articleData)
        revalidatePath('/dashboard/wiki')
        revalidatePath('/agent/wiki')
        return { success: true, article }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update article' }
    }
}

export async function deleteArticleAction(articleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        await verifyAdmin(supabase, user.id)
        await deleteArticle(articleId)
        revalidatePath('/dashboard/wiki')
        revalidatePath('/agent/wiki')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to delete article' }
    }
}
