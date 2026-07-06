import { request } from './request'
import type {
  User,
  LoginParams,
  LoginResponse,
  TwoFactorVerifyParams,
  TwoFactorBackupParams,
} from '@/types'

export const authApi = {
  /**
   * 登录第一步：账号密码 + 图形验证码
   * - 未开启 2FA → status=SUCCESS + token
   * - 已开启 2FA → status=NEED_2FA + preAuthToken（5min，不持久化）
   * ⚠️ code=200 不等于登录完成，必须看 status
   */
  login(params: LoginParams): Promise<LoginResponse> {
    return request.post('/login', params).then((res: any) => ({
      status: res.status,
      token: res.token,
      preAuthToken: res.preAuthToken,
    }))
  },

  /**
   * 登录第二步：TOTP 动态码二次验证
   * 成功 → status=SUCCESS + token
   * 失败 → reject，error.errorCode 为 two.factor.invalid / replay / locked / expired
   */
  verifyTwoFactor(params: TwoFactorVerifyParams): Promise<LoginResponse> {
    return request.post('/login/2fa/verify', params).then((res: any) => ({
      status: res.status,
      token: res.token,
    }))
  },

  /**
   * 登录第二步：备用码登录（手机丢失场景）
   * 备用码 12 位 base32，前端自动转大写
   * 失败 → reject，error.errorCode 同上（不区分"不存在"与"已用"）
   */
  verifyBackupCode(params: TwoFactorBackupParams): Promise<LoginResponse> {
    return request.post('/login/2fa/backup', params).then((res: any) => ({
      status: res.status,
      token: res.token,
    }))
  },

  logout(): Promise<void> {
    return request.post('/logout')
  },

  getCurrentUser(): Promise<User & { roles?: string[]; permissions?: string[] }> {
    return request.get('/getInfo').then((res: any) => {
      const user = res.user || {}
      const roles = res.roles || []
      return {
        id: user.userId?.toString() || user.id?.toString() || '',
        username: user.userName || user.username || '',
        nickname: user.nickName || user.nickname || '',
        email: user.email || '',
        avatar: user.avatar || '',
        role: roles.includes('admin') ? 'admin' : roles.includes('editor') ? 'editor' : 'user',
        bio: user.bio || '',
        createTime: user.createTime || user.createTime || '',
        roles,
        permissions: res.permissions || []
      }
    })
  },

  updateProfile(data: Partial<User>): Promise<User> {
    return request.put('/system/user/profile', data)
  },

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    console.log('changePassword called with:', { oldPassword, newPassword })
    return request.put('/system/user/profile/updatePwd', null, {
      params: {
        oldPassword,
        newPassword
      }
    })
  },

  uploadAvatar(file: File, onProgress?: (percent: number) => void): Promise<{ url: string; imgUrl?: string }> {
    return request.upload('/system/user/profile/avatar', file, onProgress, 'avatarfile')
  },
}
