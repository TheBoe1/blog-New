import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams, LoginResult } from '@/types'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(params: LoginParams): Promise<LoginResult> {
    try {
      const result = await authApi.login(params)
      
      token.value = result.token
      
      const userInfo = await authApi.getCurrentUser()
      user.value = {
        id: userInfo.id || '',
        username: userInfo.username || params.username,
        nickname: userInfo.nickname || userInfo.username || params.username,
        email: userInfo.email || '',
        avatar: userInfo.avatar || '',
        role: userInfo.role || 'admin',
        bio: userInfo.bio || '',
        createTime: userInfo.createTime || new Date().toISOString()
      }
      
      return {
        token: result.token,
        user: user.value
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async function fetchUserInfo() {
    try {
      const userInfo = await authApi.getCurrentUser()
      user.value = {
        id: userInfo.id || user.value?.id || '',
        username: userInfo.username || user.value?.username || '',
        nickname: userInfo.nickname || userInfo.username || user.value?.nickname || '',
        email: userInfo.email || user.value?.email || '',
        avatar: userInfo.avatar || user.value?.avatar || '',
        role: userInfo.role || user.value?.role || 'user',
        bio: userInfo.bio || user.value?.bio || '',
        createTime: userInfo.createTime || user.value?.createTime || ''
      }
      return user.value
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      return null
    }
  }

  function logout() {
    token.value = ''
    user.value = null
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    fetchUserInfo
  }
}, {
  persist: true
})
