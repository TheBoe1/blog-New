import { request } from './request'
import type {
  User,
  LoginParams,
  LoginResponse,
  TwoFactorVerifyParams,
  TwoFactorBackupParams,
  TwoFactorStatusResponse,
  TwoFactorSetupResponse,
  TwoFactorEnableResponse,
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

  // ===== 个人中心 2FA 管理（绑定/解绑/状态）=====

  /** 查询 2FA 开启状态与备用码剩余数量 */
  getTwoFactorStatus(): Promise<TwoFactorStatusResponse> {
    return request.get('/system/user/profile/2fa/status').then((res: any) => ({
      enabled: !!res.enabled,
      backupCodesRemaining: res.backupCodesRemaining || 0,
    }))
  },

  /** 发起 2FA 绑定，返回 qrUri（secret 暂存 Redis 10min，不入库） */
  setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    return request.post('/system/user/profile/2fa/setup').then((res: any) => ({
      qrUri: res.qrUri,
    }))
  },

  /**
   * 确认绑定：验证动态码，成功后 secret 加密入库
   * 返回 10 个明文备用码（仅此一次，DB 只存 SHA-256 散列）
   * 失败 → reject，error.errorCode 为 two.factor.invalid / two.factor.expired
   */
  enableTwoFactor(otpCode: string): Promise<TwoFactorEnableResponse> {
    return request.post('/system/user/profile/2fa/enable', { otpCode }).then((res: any) => ({
      backupCodes: res.backupCodes || [],
    }))
  },

  /**
   * 关闭 2FA：需校验登录密码（防止 session 劫持后直接关闭）
   * 失败 → reject（two.factor.password.error，CustomException 无 errorCode）
   */
  disableTwoFactor(password: string): Promise<void> {
    return request.post('/system/user/profile/2fa/disable', { password })
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
