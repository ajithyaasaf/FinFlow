'use client'

import { useState, useEffect } from 'react'
import { WikiHub } from '@/components/dashboard/wiki-hub'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/agent/page-header'
import { Skeleton } from '@/components/ui/skeleton'

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
            <div className="min-h-screen bg-gray-50 pb-20">
                <PageHeader
                    title="Policy Handbook"
                    subtitle="Quick guides on KYC, verification policies, and commission rules."
                />
                <main className="p-4 space-y-4">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-airbnb-sm">
                                <Skeleton className="h-4 w-1/3 rounded-lg" />
                                <Skeleton className="h-3.5 w-full rounded-lg" />
                                <Skeleton className="h-3.5 w-5/6 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PageHeader
                title="Policy Handbook"
                subtitle="Quick guides on KYC, verification policies, and commission rules."
            />

            <main className="p-4">
                <WikiHub
                    initialArticles={articles}
                    categories={categories}
                    isAdmin={false}
                />
            </main>
        </div>
    )
}
