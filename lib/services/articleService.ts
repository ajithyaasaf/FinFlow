import { createClient } from '@/lib/supabase/server'
import type { KnowledgeArticle } from '@/types'

export async function getArticles(category?: string) {
    const supabase = await createClient()

    let query = supabase.from('knowledge_articles').select('*')

    if (category) {
        query = query.eq('category', category)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching articles:', error)
        return []
    }

    return data || []
}

export async function getArticleDetails(articleId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('article_id', articleId)
        .single()

    if (error) {
        console.error('Error fetching article details:', error)
        return null
    }

    return data
}

export async function getCategories() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('knowledge_articles')
        .select('category')

    if (error) {
        console.error('Error fetching article categories:', error)
        return []
    }

    const categories = new Set(data.map(item => item.category))
    return Array.from(categories)
}

export async function createArticle(articleData: Partial<KnowledgeArticle>) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('knowledge_articles')
        .insert([articleData])
        .select()
        .single()

    if (error) {
        console.error('Error creating article:', error)
        throw error
    }

    return data
}

export async function updateArticle(articleId: string, articleData: Partial<KnowledgeArticle>) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('knowledge_articles')
        .update({ ...articleData, updated_at: new Date().toISOString() })
        .eq('article_id', articleId)
        .select()
        .single()

    if (error) {
        console.error('Error updating article:', error)
        throw error
    }

    return data
}

export async function deleteArticle(articleId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('article_id', articleId)

    if (error) {
        console.error('Error deleting article:', error)
        throw error
    }

    return true
}
