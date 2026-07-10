import { getArticles, getCategories } from '@/lib/services/articleService'
import { WikiHub } from '@/components/dashboard/wiki-hub'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function AdminWikiPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Policy Wiki</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage internal policy updates, commission structures, and verification guides.</p>
            </div>

            <Suspense fallback={
                <div className="space-y-4 py-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-50 rounded-xl animate-pulse border border-gray-200"></div>
                        ))}
                    </div>
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
            isAdmin={true}
        />
    )
}
