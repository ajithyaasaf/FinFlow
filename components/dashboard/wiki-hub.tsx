'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Search, Plus, Edit, Trash, ChevronRight, FileText, Loader2, ArrowLeft } from 'lucide-react'
import type { KnowledgeArticle } from '@/types'
import { createArticleAction, updateArticleAction, deleteArticleAction } from '@/app/actions/articles'

interface WikiHubProps {
    initialArticles: KnowledgeArticle[]
    categories: string[]
    isAdmin: boolean
}

export function WikiHub({ initialArticles, categories, isAdmin }: WikiHubProps) {
    const [articles, setArticles] = useState<KnowledgeArticle[]>(initialArticles)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
    const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        is_internal: true
    })

    const filteredArticles = articles.filter(article => {
        const matchesSearch = 
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'ALL' || article.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleOpenCreate = () => {
        setSelectedArticle(null)
        setFormData({
            title: '',
            content: '',
            category: '',
            is_internal: true
        })
        setModalOpen(true)
    }

    const handleOpenEdit = (article: KnowledgeArticle, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedArticle(article)
        setFormData({
            title: article.title,
            content: article.content,
            category: article.category,
            is_internal: article.is_internal
        })
        setModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title.trim() || !formData.content.trim() || !formData.category.trim()) {
            toast.error('Title, Category, and Content are required')
            return
        }

        setLoading(true)
        try {
            if (selectedArticle) {
                const result = await updateArticleAction(selectedArticle.article_id, formData)
                if (!result.success) throw new Error(result.error)
                const updated = result.article as KnowledgeArticle
                setArticles(prev => prev.map(a => a.article_id === selectedArticle.article_id ? updated : a))
                setSelectedArticle(updated)
                toast.success('Article updated successfully!')
            } else {
                const result = await createArticleAction(formData)
                if (!result.success) throw new Error(result.error)
                if (result.article) setArticles(prev => [result.article as KnowledgeArticle, ...prev])
                toast.success('Article created successfully!')
            }
            setModalOpen(false)
        } catch (error: any) {
            toast.error(error.message || 'Failed to save article')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (articleId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this article?')) return

        // Optimistic remove with rollback on failure
        const previousArticles = articles
        setArticles(prev => prev.filter(a => a.article_id !== articleId))
        if (selectedArticle?.article_id === articleId) setSelectedArticle(null)

        try {
            const result = await deleteArticleAction(articleId)
            if (!result.success) throw new Error(result.error)
            toast.success('Article deleted successfully!')
        } catch (error: any) {
            setArticles(previousArticles) // Rollback
            toast.error(error.message || 'Failed to delete article')
        }
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/70 backdrop-blur p-4 rounded-xl border">
                <div className="flex flex-1 flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full max-w-[320px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search wiki articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory('ALL')}
                            className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold border transition-all ${
                                selectedCategory === 'ALL'
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold border transition-all ${
                                    selectedCategory === cat
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {isAdmin && (
                    <Button onClick={handleOpenCreate} className="gap-2 w-full md:w-auto">
                        <Plus className="h-4 w-4" />
                        New Article
                    </Button>
                )}
            </div>

            {/* Content view */}
            {selectedArticle ? (
                /* Article Reader View */
                <Card className="border shadow-sm">
                    <CardHeader className="border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                        <div className="space-y-1">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline mb-2"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back to Wiki
                            </button>
                            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">{selectedArticle.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700 bg-gray-100 py-0.5 px-2 rounded-md text-xs">{selectedArticle.category}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs text-gray-400">Last updated: {new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
                            </CardDescription>
                        </div>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => handleOpenEdit(selectedArticle, e)}
                                    className="gap-1 text-xs"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => handleDelete(selectedArticle.article_id, e)}
                                    className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash className="h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="py-6 prose max-w-none">
                        {/* Simple Markdown Render - Pre-wrap preserves line breaks and spacing */}
                        <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans font-medium">
                            {selectedArticle.content}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Categories / Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                        <Card
                            key={article.article_id}
                            onClick={() => setSelectedArticle(article)}
                            className="hover:shadow-md cursor-pointer transition border border-gray-200 flex flex-col justify-between"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold tracking-wider text-primary bg-primary/10 py-0.5 px-2 rounded-full uppercase">
                                        {article.category}
                                    </span>
                                    {article.is_internal && (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Internal</span>
                                    )}
                                </div>
                                <CardTitle className="text-base font-bold text-gray-900 group-hover:text-primary leading-snug">
                                    {article.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed font-medium">
                                    {article.content}
                                </p>
                                <div className="flex items-center justify-between border-t pt-3 text-[11px] text-gray-400">
                                    <span className="flex items-center gap-1 font-semibold text-primary hover:underline">
                                        Read Article
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </span>
                                    <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredArticles.length === 0 && (
                        <div className="col-span-full bg-white rounded-xl border border-dashed p-12 text-center">
                            <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-gray-700">No Wiki Articles Found</h3>
                            <p className="text-xs text-gray-400 mt-1">Try resetting filters or create a new article guide.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedArticle ? 'Edit Wiki Article' : 'Create Wiki Article'}
                        </DialogTitle>
                        <DialogDescription>
                            Write guides, documents, and rules that your staff members can access in the app.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="art_title">Article Title *</Label>
                            <Input
                                id="art_title"
                                placeholder="e.g. KYC Collection Guidelines"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="art_cat">Category *</Label>
                                <Input
                                    id="art_cat"
                                    placeholder="e.g. KYC Rules, Policies"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2 flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="art_internal"
                                        checked={formData.is_internal}
                                        onChange={(e) => setFormData({ ...formData, is_internal: e.target.checked })}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <Label htmlFor="art_internal" className="text-xs select-none">Internal (Staff Only)</Label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="art_content">Content Guide *</Label>
                            <Textarea
                                id="art_content"
                                placeholder="Write guidelines and notes here. You can use standard formatting."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={10}
                                className="font-mono text-sm leading-relaxed"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Saving...' : 'Save Article'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
