import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useLoadingStore } from '@/stores/loading'

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
  '/api/stats/summary',
  '/api/page-config'
]

function isWhiteListUrl(url: string): boolean {
  return WHITE_LIST.some(whiteUrl => url.startsWith(whiteUrl))
}

function shouldSilentError(url: string, method: string): boolean {
  if (url === '/login' && method.toLowerCase() === 'get') {
    return true
  }
  return false
}

let isRedirecting = false

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
    const loadingStore = useLoadingStore()
    const token = userStore.token

    const isAdminApi = config.url?.startsWith('/api/admin')

    // admin API 走页面级 loading（v-loading），不触发全局遮罩，避免路由切换时全屏闪烁
    if (!isWhiteListUrl(config.url || '') && !isAdminApi) {
      loadingStore.showLoading()
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (import.meta.env.DEV) {
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
        isAdminApi,
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
    const loadingStore = useLoadingStore()
    loadingStore.hideLoading()
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const loadingStore = useLoadingStore()
    loadingStore.hideLoading()
    
    const { data, config } = response
    
    if (data.code === 401) {
      handleTokenExpired(config?.url || '')
      return Promise.reject(new Error(data.msg || data.message || '未授权'))
    }
    
    if (data.code === 403) {
      console.error('[Response 403] Permission denied', {
        url: config?.url,
        message: data.msg || data.message
      })
      
      if (window.location.pathname !== '/unauthorized') {
        window.location.href = '/unauthorized'
      }
      
      return Promise.reject(new Error(data.msg || data.message || '无权限'))
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

    // 业务失败（code=500 等）：携带 errorCode 供调用方按业务错误码路由
    // 2FA 场景: two.factor.invalid / replay / locked / expired / password.error
    if (!shouldSilentError(config?.url || '', config?.method || 'get')) {
      ElMessage.error(data.msg || data.message || '请求失败')
    }
    const err = new Error(data.msg || data.message || '请求失败') as Error & {
      errorCode?: string
      data?: any
    }
    if (data.errorCode) {
      err.errorCode = data.errorCode
    }
    err.data = data
    return Promise.reject(err)
  },
  (error) => {
    const loadingStore = useLoadingStore()
    loadingStore.hideLoading()
    
    const { response, config } = error
    
    if (!response) {
      if (error.code === 'ERR_NETWORK') {
        if (!shouldSilentError(config?.url || '', config?.method || 'get')) {
          ElMessage.error('网络连接失败，请检查网络')
        }
        console.error('Network Error:', config?.url)
      } else if (!shouldSilentError(config?.url || '', config?.method || 'get')) {
        ElMessage.error('网络错误，请稍后重试')
      }
      return Promise.reject(error)
    }
    
    if (response?.status === 401) {
      handleTokenExpired(config?.url || '')
      return Promise.reject(error)
    }
    
    if (response?.status === 403) {
      if (window.location.pathname !== '/unauthorized') {
        window.location.href = '/unauthorized'
      }
      return Promise.reject(error)
    }
    
    if (response?.status === 500) {
      if (shouldSilentError(config?.url || '', config?.method || 'get')) {
        console.log('[Silent] Login page GET request error ignored')
        return Promise.reject(error)
      }
      
      const errorMsg = response?.data?.msg || response?.data?.message || '服务器内部错误'
      if (errorMsg.includes('不支持请求方法') || errorMsg.includes('GET')) {
        console.log('[Silent] Method not supported error:', config?.url)
        return Promise.reject(error)
      }
      
      ElMessage.error('服务器内部错误，请稍后重试')
      console.error('[Response 500]:', config?.url, errorMsg)
      return Promise.reject(error)
    }
    
    if (!shouldSilentError(config?.url || '', config?.method || 'get')) {
      ElMessage.error(response?.data?.msg || response?.data?.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

function handleTokenExpired(requestUrl: string) {
  if (isRedirecting) {
    return
  }
  
  const isWhiteUrl = isWhiteListUrl(requestUrl)
  
  console.error('[Token Expired]', {
    url: requestUrl,
    isWhiteList: isWhiteUrl,
    currentPath: window.location.pathname
  })
  
  if (!isWhiteUrl) {
    isRedirecting = true
    
    const userStore = useUserStore()
    userStore.logout()
    
    if (window.location.pathname !== '/login' && window.location.pathname !== '/unauthorized') {
      ElMessage({
        type: 'warning',
        message: '登录已过期，请重新登录',
        duration: 2000,
        onClose: () => {
          isRedirecting = false
        }
      })
      
      setTimeout(() => {
        window.location.href = '/login'
      }, 300)
    } else {
      isRedirecting = false
    }
  }
}

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
