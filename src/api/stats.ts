import { request } from './request'
import type { DashboardStats, RealtimeStats, VisitTrend, VisitLog, VisitBlacklist, BlogSettings } from '@/types'

export const statsApi = {
  getDashboard(): Promise<DashboardStats> {
    return request.get('/api/stats/dashboard')
  },

  getRealtime(): Promise<RealtimeStats> {
    return request.get('/api/stats/realtime')
  },

  getTrend(params: { startDate: string; endDate: string; granularity?: string }): Promise<{
    summary: { totalPV: number; totalUV: number; totalIP: number; avgDailyPV: number; avgDailyUV: number }
    trend: VisitTrend[]
    comparison: { pvGrowth: number; uvGrowth: number; ipGrowth: number }
  }> {
    return request.get('/api/stats/trend', { params })
  },

  recordVisit(data: {
    url: string
    path: string
    title?: string
    referer?: string
    articleId?: string
    timestamp?: number
  }): Promise<{ sessionId: string; visitorId: string }> {
    return request.post('/api/stats/visit', data)
  },

  updateDuration(data: { sessionId: string; duration: number }): Promise<void> {
    return request.put('/api/stats/visit/duration', data)
  },

  getVisitLogs(params?: { page?: number; pageSize?: number; ip?: string; path?: string }): Promise<{
    list: VisitLog[]
    total: number
  }> {
    return request.get('/api/stats/visit/logs', { params })
  },

  getBlacklist(): Promise<VisitBlacklist[]> {
    return request.get('/api/stats/blacklist')
  },

  addBlacklist(data: { ip: string; reason: string; expireAt?: string }): Promise<VisitBlacklist> {
    return request.post('/api/stats/blacklist', data)
  },

  removeBlacklist(id: number): Promise<void> {
    return request.delete(`/api/stats/blacklist/${id}`)
  },

  checkBlocked(ip: string): Promise<boolean> {
    return request.post('/api/stats/blacklist/check', { ip })
  }
}

export const settingsApi = {
  getSettings(): Promise<BlogSettings> {
    return request.get('/api/settings')
  },

  updateSettings(data: Partial<BlogSettings>): Promise<void> {
    return request.put('/api/settings', data)
  }
}
