export interface Article {
  id: string
  title: string
  slug: string
  content: string
  htmlContent: string
  markdownContent?: string
  summary: string
  cover?: string
  categoryId: string
  categoryName: string
  tags: string[]
  author: string
  authorId: string
  viewCount: number
  likeCount: number
  commentCount: number
  isPublished: boolean
  isTop: boolean
  createTime: string
  updateTime: string
  publishedAt?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  sortOrder: number
  articleCount: number
  createTime: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  color?: string
  articleCount: number
}

export interface User {
  id: string
  username: string
  nickname: string
  email: string
  avatar?: string
  role: 'admin' | 'editor' | 'user'
  bio?: string
  createTime: string
}

export interface Comment {
  id: string
  articleId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  parentId?: string
  replies?: Comment[]
  isApproved: boolean
  createTime: string
}

export interface ApiResponse<T = any> {
  code: number
  msg?: string
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  rows?: T[]
  list?: T[]
  total: number
  page?: number
  pageSize?: number
  totalPages?: number
}

export interface ArticleQuery {
  keyword?: string
  categoryId?: string
  tag?: string
  year?: number
  month?: number
  isPublished?: boolean
  page?: number
  pageSize?: number
  sortBy?: 'createTime' | 'viewCount' | 'likeCount'
  sortOrder?: 'asc' | 'desc'
}

export interface LoginParams {
  username: string
  password: string
  code?: string
  uuid?: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface UploadResult {
  url: string
  filename: string
  size: number
  mimeType: string
}

export interface DashboardStats {
  articleCount: number
  viewCount: number
  likeCount: number
  categoryCount: number
  tagCount: number
  todayPV: number
  todayUV: number
  onlineUsers: number
  recentArticles: Article[]
  categoryStats: CategoryStat[]
}

export interface CategoryStat {
  categoryId: string
  categoryName: string
  count: number
}

export interface VisitTrend {
  date: string
  pv: number
  uv: number
  ip: number
}

export interface RealtimeStats {
  onlineUsers: number
  todayPV: number
  todayUV: number
  todayIP: number
  avgStayDuration: number
  bounceRate: number
  peakHour: { hour: number; pv: number }
  topPages: { path: string; title: string; pv: number }[]
  topReferrers: { source: string; count: number }[]
  deviceStats: { pc: number; mobile: number; tablet: number }
}

export interface VisitLog {
  id: number
  visitorId: string
  sessionId: string
  ip: string
  userAgent: string
  referer: string
  url: string
  path: string
  title: string
  deviceType: 'pc' | 'mobile' | 'tablet'
  browser: string
  os: string
  country: string
  province: string
  city: string
  stayDuration: number
  articleId?: string
  isValid: boolean
  isBot: boolean
  timestamp: number
}

export interface VisitBlacklist {
  id: number
  ip: string
  reason: string
  expireAt?: string
  createTime: string
}

export interface BlogSettings {
  siteName: string
  siteDescription: string
  siteKeywords: string
  siteLogo: string
  siteFavicon: string
  footerText: string
  icp: string
  socialLinks: Record<string, string>
}

export interface PageElementConfig {
  id: string
  page: string
  elementKey: string
  elementType: 'label' | 'text' | 'html' | 'image' | 'link' | 'list'
  content: string
  styles: Record<string, string>
  attributes: Record<string, string>
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface PageSectionConfig {
  id: string
  page: string
  sectionKey: string
  sectionName: string
  layout: 'grid' | 'flex' | 'list' | 'custom'
  layoutConfig: {
    columns?: number
    gap?: string
    direction?: 'row' | 'column'
    wrap?: boolean
  }
  styles: Record<string, string>
  elements: PageElementConfig[]
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface PageConfig {
  id: string
  page: string
  pageName: string
  description?: string
  sections: PageSectionConfig[]
  globalStyles: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface ConfigFieldValue {
  key: string
  label: string
  value: string
  type: 'text' | 'textarea' | 'number' | 'color' | 'select' | 'switch' | 'image'
  options?: { label: string; value: string }[]
  placeholder?: string
  defaultValue?: string
}

export interface ConfigFieldGroup {
  key: string
  title: string
  fields: ConfigFieldValue[]
}
