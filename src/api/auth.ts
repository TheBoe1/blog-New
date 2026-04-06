import { request } from './request'
import type { User, LoginParams, LoginResult } from '@/types'

export const authApi = {
  login(params: LoginParams): Promise<LoginResult> {
    return request.post('/login', params).then((res: any) => {
      return {
        token: res.token
      }
    })
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

  uploadAvatar(file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> {
    return request.upload('/system/user/profile/avatar', file, onProgress, 'avatarfile')
  },
}
