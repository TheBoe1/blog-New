import { request } from './request'
import type { BlogSettings } from '@/types'

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
    return request.post('/api/stats/visit', data)
  },

  updateDuration(data: { sessionId: string; duration: number }): Promise<void> {
    return request.put('/api/stats/visit/duration', data)
  },

  getSummary(): Promise<VisitSummary> {
    return request.get('/api/stats/summary')
  }
}

export const settingsApi = {
  getSettings(): Promise<BlogSettings> {
    return request.get('/api/settings')
  }
}
