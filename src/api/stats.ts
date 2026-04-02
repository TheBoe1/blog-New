import { request } from './request'
import type { VisitLog, BlogSettings } from '@/types'

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
  }
}

export const settingsApi = {
  getSettings(): Promise<BlogSettings> {
    return request.get('/api/settings')
  }
}
