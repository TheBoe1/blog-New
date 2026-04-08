import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types'

const WHITE_LIST = [
  '/login',
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
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
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
    } else {
      console.warn(`[Request] No token found for ${config.url}`)
    }
    
    if (import.meta.env.DEV) {
      const isAdminApi = config.url?.startsWith('/api/admin')
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
        authorization: config.headers.Authorization ? `Bearer ${token?.substring(0, 20)}...` : 'undefined',
        data: config.data,
        isAdminApi,
        tokenLength: token?.length,
        userStoreState: {
          isLoggedIn: userStore.isLoggedIn,
          isAdmin: userStore.isAdmin,
          username: userStore.user?.username
        }
      })
      
      if (isAdminApi && !token) {
        console.error('[Auth Error] Admin API called without token!', {
          url: config.url,
          solution: 'Please login first or check token storage'
        })
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data, config } = response
    
    if (data.code === 401) {
      const isWhiteUrl = isWhiteListUrl(config?.url || '')
      
      console.error('[Response 401]', {
        url: config?.url,
        isWhiteList: isWhiteUrl,
        message: data.msg || data.message,
        solution: isWhiteUrl 
          ? '后端白名单配置错误，请联系后端开发人员'
          : 'Token已过期，请重新登录'
      })
      
      if (!isWhiteUrl) {
        const userStore = useUserStore()
        userStore.logout()
        
        if (window.location.pathname !== '/login' && window.location.pathname !== '/unauthorized') {
          ElMessage.error('登录已过期，请重新登录')
          window.location.href = '/login'
        }
      } else {
        ElMessage.error(`${data.msg || '认证失败'}（白名单接口不应该需要认证）`)
      }
      
      return Promise.reject(new Error(data.msg || data.message))
    }
    
    if (data.code === 403) {
      console.error('[Response 403] Permission denied', {
        url: config?.url,
        message: data.msg || data.message
      })
      
      if (window.location.pathname !== '/unauthorized') {
        window.location.href = '/unauthorized'
      }
      
      return Promise.reject(new Error(data.msg || data.message))
    }
    
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
    
    if (!response) {
      if (error.code === 'ERR_NETWORK') {
        ElMessage.error('网络连接失败，请检查网络或CORS配置')
        console.error('CORS Error or Network Error:', {
          url: config?.url,
          baseURL: config?.baseURL,
          message: '可能原因：1. 后端未启动 2. CORS配置错误 3. 网络问题'
        })
      } else {
        ElMessage.error('网络错误，请稍后重试')
      }
      return Promise.reject(error)
    }
    
    if (response?.status === 401) {
      const isWhiteUrl = isWhiteListUrl(config?.url || '')
      
      if (!isWhiteUrl) {
        const userStore = useUserStore()
        userStore.logout()
        
        if (window.location.pathname !== '/login' && window.location.pathname !== '/unauthorized') {
          ElMessage.error('登录已过期，请重新登录')
          window.location.href = '/login'
        }
      } else {
        console.warn(`White list URL ${config?.url} returned 401, but this is allowed`)
      }
    } else if (response?.status === 403) {
      console.error('[Response 403] Permission denied', {
        url: config?.url,
        message: response?.data?.msg || response?.data?.message
      })
      
      if (window.location.pathname !== '/unauthorized') {
        window.location.href = '/unauthorized'
      }
    } else if (response?.status === 500) {
      // 检查是否是登录页面的GET请求不支持错误
      const isLoginPageGetError = config?.url?.includes('/auth/login') && 
                                   config?.method?.toLowerCase() === 'get' &&
                                   window.location.pathname === '/login'
      
      if (isLoginPageGetError) {
        // 登录页面刷新导致的GET请求错误，静默处理
        console.log('Login page refresh detected, ignoring GET request error')
        return Promise.reject(error)
      }
      
      // 其他500错误，显示友好提示
      ElMessage.error('服务器内部错误，请稍后重试或联系管理员')
      console.error('[Response 500] Server error:', {
        url: config?.url,
        method: config?.method,
        message: response?.data?.msg || response?.data?.message
      })
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
  upload<T = any>(url: string, file: File, onProgress?: (percent: number) => void, fieldName: string = 'file', params?: Record<string, any>): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          formData.append(key, params[key])
        }
      })
    }
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
