import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types'

const WHITE_LIST = [
  '/login',
  '/api/login',
  '/logout',
  '/register',
  '/captchaImage',
  '/api/articles',
  '/api/categories',
  '/api/tags',
  '/api/settings',
  '/api/stats/visit',
  '/api/page-config'
]

function isWhiteListUrl(url: string): boolean {
  return WHITE_LIST.some(whiteUrl => url.startsWith(whiteUrl))
}

const instance: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

instance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    if (data.code === 0 || data.code === 200) {
      if (data.data !== undefined) {
        return data.data
      }
      if (data.rows !== undefined) {
        return { rows: data.rows, total: data.total || 0 }
      }
      return data
    }
    ElMessage.error(data.msg || data.message || '请求失败')
    return Promise.reject(new Error(data.msg || data.message))
  },
  (error) => {
    const { response, config } = error
    
    if (response?.status === 401) {
      const isWhiteUrl = isWhiteListUrl(config?.url || '')
      
      if (!isWhiteUrl) {
        const userStore = useUserStore()
        userStore.logout()
        
        if (window.location.pathname !== '/login') {
          ElMessage.error('登录已过期，请重新登录')
          window.location.href = '/login'
        }
      } else {
        console.warn(`White list URL ${config?.url} returned 401, but this is allowed`)
      }
    } else {
      ElMessage.error(response?.data?.msg || response?.data?.message || '网络错误')
    }
    
    return Promise.reject(error)
  }
)

export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config)
  },
  upload<T = any>(url: string, file: File, onProgress?: (percent: number) => void): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    return instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
  },
}

export default instance
