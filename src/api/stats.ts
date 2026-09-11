import { request } from './request'
import type { BlogSettings, VisitLog } from '@/types'

export interface VisitSummary {
  totalVisitors: number
  todayVisitors: number
  todayPv: number
  visitorIp: string
  visitorLocation: string
}

export interface VisitBlacklist {
  id?: number
  ip: string
  reason?: string
  expireAt?: string
  createTime?: string
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

export const blacklistApi = {
  /** 拉黑 IP（管理员） */
  add(data: { ip: string; reason?: string; expireAt?: string }): Promise<void> {
    return request.post<void>('/api/stats/blacklist', data)
  },

  /** 解除拉黑（按 id） */
  remove(ids: number[]): Promise<void> {
    return request.delete<void>(`/api/stats/blacklist/${ids.join(',')}`)
  },

  /** 检查 IP 是否已被拉黑 */
  check(ip: string): Promise<boolean> {
    return request.post<boolean>('/api/stats/blacklist/check', { ip })
  },

  /** 拉黑列表（分页） */
  list(params: { pageNum?: number; pageSize?: number; ip?: string; reason?: string } = {}): Promise<{ rows: VisitBlacklist[]; total: number }> {
    return request.get<{ rows: VisitBlacklist[]; total: number }>('/api/stats/blacklist', { params })
  }
}

export const settingsApi = {
  getSettings(): Promise<BlogSettings> {
    return request.get('/api/settings')
  }
}
