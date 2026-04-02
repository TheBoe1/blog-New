import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Article, Category, Tag, ArticleQuery, DashboardStats, VisitTrend } from '@/types'
import { articleApi, categoryApi, tagApi } from '@/api/article'
import { adminArticleApi, adminCategoryApi, adminTagApi, adminStatsApi } from '@/api/admin'

export const useBlogStore = defineStore('blog', () => {
  const articles = ref<Article[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const currentArticle = ref<Article | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const dashboardStats = ref<DashboardStats | null>(null)
  const visitTrend = ref<VisitTrend[]>([])

  const articleCount = computed(() => total.value || articles.value.length)
  const categoryCount = computed(() => categories.value.length)
  const tagCount = computed(() => tags.value.length)
  const recentArticles = computed(() => 
    articles.value.slice(0, 5).sort((a, b) => 
      new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    )
  )

  async function fetchArticles(params?: ArticleQuery): Promise<{ list: Article[]; total: number }> {
    loading.value = true
    try {
      const response = await articleApi.getList(params || {})
      const list = response.rows || response.list || []
      const totalNum = response.total || 0
      articles.value = list
      total.value = totalNum
      return { list: articles.value, total: total.value }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      articles.value = []
      total.value = 0
      return { list: [], total: 0 }
    } finally {
      loading.value = false
    }
  }

  async function fetchAdminArticles(params?: ArticleQuery): Promise<{ list: Article[]; total: number }> {
    loading.value = true
    try {
      const response = await adminArticleApi.getList(params || {})
      const list = response.rows || response.list || []
      const totalNum = response.total || 0
      articles.value = list
      total.value = totalNum
      return { list: articles.value, total: total.value }
    } catch (error) {
      console.error('Failed to fetch admin articles:', error)
      articles.value = []
      total.value = 0
      return { list: [], total: 0 }
    } finally {
      loading.value = false
    }
  }

  async function fetchArticleById(id: string): Promise<Article | null> {
    loading.value = true
    try {
      const article = await articleApi.getById(id)
      currentArticle.value = article
      return article
    } catch (error) {
      console.error('Failed to fetch article:', error)
      currentArticle.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function createArticle(article: Partial<Article>): Promise<Article> {
    loading.value = true
    try {
      const newArticle = await adminArticleApi.create(article)
      articles.value.unshift(newArticle)
      total.value++
      return newArticle
    } catch (error) {
      console.error('Failed to create article:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateArticle(id: string, article: Partial<Article>): Promise<Article> {
    loading.value = true
    try {
      const updatedArticle = await adminArticleApi.update(id, article)
      const index = articles.value.findIndex(a => a.id === id)
      if (index !== -1) {
        articles.value[index] = updatedArticle
      }
      return updatedArticle
    } catch (error) {
      console.error('Failed to update article:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteArticle(id: string): Promise<void> {
    loading.value = true
    try {
      await adminArticleApi.delete(id)
      articles.value = articles.value.filter(a => a.id !== id)
      total.value--
    } catch (error) {
      console.error('Failed to delete article:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories(): Promise<Category[]> {
    loading.value = true
    try {
      categories.value = await categoryApi.getList()
      return categories.value
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      categories.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function createCategory(category: Partial<Category>): Promise<Category> {
    try {
      const newCategory = await adminCategoryApi.create(category)
      categories.value.push(newCategory)
      return newCategory
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  }

  async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    try {
      const updatedCategory = await adminCategoryApi.update(id, category)
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }
      return updatedCategory
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    try {
      await adminCategoryApi.delete(id)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  }

  async function fetchTags(): Promise<Tag[]> {
    loading.value = true
    try {
      tags.value = await tagApi.getList()
      return tags.value
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      tags.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function createTag(tag: Partial<Tag>): Promise<Tag> {
    try {
      const newTag = await adminTagApi.create(tag)
      tags.value.push(newTag)
      return newTag
    } catch (error) {
      console.error('Failed to create tag:', error)
      throw error
    }
  }

  async function updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
    try {
      const updatedTag = await adminTagApi.update(id, tag)
      const index = tags.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tags.value[index] = updatedTag
      }
      return updatedTag
    } catch (error) {
      console.error('Failed to update tag:', error)
      throw error
    }
  }

  async function deleteTag(id: string): Promise<void> {
    try {
      await adminTagApi.delete(id)
      tags.value = tags.value.filter(t => t.id !== id)
    } catch (error) {
      console.error('Failed to delete tag:', error)
      throw error
    }
  }

  async function fetchDashboardStats(): Promise<DashboardStats | null> {
    try {
      const data = await adminStatsApi.getDashboard()
      dashboardStats.value = {
        articleCount: data.articleCount,
        viewCount: 0,
        likeCount: 0,
        categoryCount: data.categoryCount,
        tagCount: data.tagCount,
        todayPV: data.todayPV,
        todayUV: data.todayUV,
        onlineUsers: 0,
        recentArticles: data.recentArticles || [],
        categoryStats: []
      }
      return dashboardStats.value
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      return null
    }
  }

  async function fetchVisitTrend(startDate: string, endDate: string, granularity: string = 'day'): Promise<VisitTrend[]> {
    try {
      const response = await adminStatsApi.getTrend({ startDate, endDate, granularity })
      visitTrend.value = response.trend || []
      return visitTrend.value
    } catch (error) {
      console.error('Failed to fetch visit trend:', error)
      return []
    }
  }

  return {
    articles,
    categories,
    tags,
    currentArticle,
    loading,
    total,
    dashboardStats,
    visitTrend,
    articleCount,
    categoryCount,
    tagCount,
    recentArticles,
    fetchArticles,
    fetchAdminArticles,
    fetchArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    fetchDashboardStats,
    fetchVisitTrend
  }
})
