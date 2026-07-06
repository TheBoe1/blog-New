import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams, LoginResult } from '@/types'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  /**
   * 登录成功后加载用户信息（login / completeTwoFactor / completeBackup 共用）
   * 失败直接抛错——登录流程中拿不到用户信息属于异常，不应静默
   */
  async function loadUserInfo(fallbackUsername: string): Promise<User> {
    const userInfo = await authApi.getCurrentUser()
    user.value = {
      id: userInfo.id || '',
      username: userInfo.username || fallbackUsername,
      nickname: userInfo.nickname || userInfo.username || fallbackUsername,
      email: userInfo.email || '',
      avatar: userInfo.avatar || '',
      role: userInfo.role || 'admin',
      bio: userInfo.bio || '',
      createTime: userInfo.createTime || new Date().toISOString()
    }
    return user.value
  }

  /**
   * 登录第一步：账号密码 + 图形验证码
   * 返回 status 分流:
   *   SUCCESS   → token + user（登录完成）
   *   NEED_2FA  → preAuthToken（Login.vue 进二次验证步骤，不存 token）
   * ⚠️ code=200 不等于登录完成，必须看 status
   */
  async function login(params: LoginParams): Promise<LoginResult> {
    const result = await authApi.login(params)

    if (result.status === 'NEED_2FA') {
      return {
        status: 'NEED_2FA',
        preAuthToken: result.preAuthToken
      }
    }

    // SUCCESS：存 token + 拉用户信息
    token.value = result.token!
    await loadUserInfo(params.username)
    return {
      status: 'SUCCESS',
      token: result.token,
      user: user.value!
    }
  }

  /** 登录第二步：TOTP 动态码二次验证（preAuthToken 由 Login.vue 内存持有） */
  async function completeTwoFactor(preAuthToken: string, otpCode: string): Promise<LoginResult> {
    const result = await authApi.verifyTwoFactor({ preAuthToken, otpCode })
    token.value = result.token!
    await loadUserInfo('')
    return {
      status: 'SUCCESS',
      token: result.token,
      user: user.value!
    }
  }

  /** 登录第二步：备用码登录（手机丢失场景） */
  async function completeBackup(preAuthToken: string, backupCode: string): Promise<LoginResult> {
    const result = await authApi.verifyBackupCode({ preAuthToken, backupCode })
    token.value = result.token!
    await loadUserInfo('')
    return {
      status: 'SUCCESS',
      token: result.token,
      user: user.value!
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
    completeTwoFactor,
    completeBackup,
    logout,
    fetchUserInfo
  }
}, {
  persist: true
})
