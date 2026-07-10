import { getArticles, getCategories } from '@/lib/services/articleService'
import { WikiHub } from '@/components/dashboard/wiki-hub'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function AgentWikiPage() {
    return (
        <div className="p-4 space-y-4 pb-20">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Policy Handbook</h1>
                <p className="text-xs text-gray-500">Quick guides on KYC, verification policies, and commission rules.</p>
            </div>

            <Suspense fallback={
                <div className="space-y-4 py-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="h-32 bg-gray-55 rounded animate-pulse w-full"></div>
                    <div className="h-32 bg-gray-55 rounded animate-pulse w-full"></div>
                </div>
            }>
                <WikiLoader />
            </Suspense>
        </div>
    )
}

async function WikiLoader() {
    const [articles, categories] = await Promise.all([
        getArticles(),
        getCategories()
    ])

    return (
        <WikiHub
            initialArticles={articles || []}
            categories={categories || []}
            isAdmin={false}
        />
    )
}
