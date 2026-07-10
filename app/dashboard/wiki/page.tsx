'use client'

import { useState, useEffect } from 'react'
import { WikiHub } from '@/components/dashboard/wiki-hub'
import { createClient } from '@/lib/supabase/client'
import Loading from './loading'

export default function AdminWikiPage() {
    const [loading, setLoading] = useState(true)
    const [articles, setArticles] = useState<any[]>([])
    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        async function fetchWikiData() {
            try {
                const supabase = createClient()
                
                const [articlesRes, categoriesRes] = await Promise.all([
                    supabase.from('knowledge_articles').select('*').order('created_at', { ascending: false }),
                    supabase.from('knowledge_articles').select('category')
                ])

                if (articlesRes.data) {
                    setArticles(articlesRes.data)
                }

                if (categoriesRes.data) {
                    const cats = new Set(categoriesRes.data.map(item => item.category))
                    setCategories(Array.from(cats))
                }
            } catch (error) {
                console.error('Failed to load wiki data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchWikiData()
    }, [])

    if (loading) {
        return <Loading />
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Policy Wiki</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage internal policy updates, commission structures, and verification guides.</p>
            </div>

            <WikiHub
                initialArticles={articles}
                categories={categories}
                isAdmin={true}
            />
        </div>
    )
}
