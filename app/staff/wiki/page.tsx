'use client'

import { useState, useEffect } from 'react'
import { WikiHub } from '@/components/dashboard/wiki-hub'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AgentWikiPage() {
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
        return (
            <div className="p-4 space-y-4 pb-20">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Policy Handbook</h1>
                    <p className="text-xs text-gray-500">Quick guides on KYC, verification policies, and commission rules.</p>
                </div>
                <div className="space-y-4 py-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="h-32 bg-gray-50 rounded animate-pulse w-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4 pb-20">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Policy Handbook</h1>
                <p className="text-xs text-gray-500">Quick guides on KYC, verification policies, and commission rules.</p>
            </div>

            <WikiHub
                initialArticles={articles}
                categories={categories}
                isAdmin={false}
            />
        </div>
    )
}
