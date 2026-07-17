import { request } from './request'
import type { BlogSettings, VisitLog } from '@/types'

export interface VisitSummary {
  totalVisitors: number
  todayVisitors: number
  todayPv: number
  visitorIp: string
  visitorLocation: string
}

export const statsApi = {
  recordVisit(data: {
    url: string
    path: string
    title?: string
    referer?: string
    articleId?: string
    timestamp?: number
  }): Promise<{ sessionId: string; visitorId: string }> {
    return request.post<{ sessionId: string; visitorId: string }>('/api/stats/visit', data, { showGlobalLoading: false })
  },

  updateDuration(data: { sessionId: string; duration: number }): Promise<void> {
    return request.put<void>('/api/stats/visit/duration', data, { showGlobalLoading: false })
  },

  getSummary(): Promise<VisitSummary> {
    return request.get<VisitSummary>('/api/stats/summary', { showGlobalLoading: false })
  },

  getVisitLogs(params: Record<string, any>): Promise<{ rows: VisitLog[]; total: number }> {
    return request.get('/api/admin/stats/visit/logs', { params })
  }
}

export const settingsApi = {
  getSettings(): Promise<BlogSettings> {
    return request.get('/api/settings')
  }
}
