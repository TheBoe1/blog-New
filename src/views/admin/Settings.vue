<template>
  <div class="settings">
    <el-card shadow="never">
      <template #header>
        <span>基本设置</span>
      </template>
      <el-form :model="basicForm" label-width="100px" style="max-width: 600px">
        <el-form-item label="网站名称">
          <el-input v-model="basicForm.siteName" placeholder="请输入网站名称" />
        </el-form-item>
        <el-form-item label="网站描述">
          <el-input
            v-model="basicForm.siteDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入网站描述"
          />
        </el-form-item>
        <el-form-item label="网站关键词">
          <el-input v-model="basicForm.siteKeywords" placeholder="请输入关键词，用逗号分隔" />
        </el-form-item>
        <el-form-item label="网站Logo">
          <el-upload
            class="logo-uploader"
            :show-file-list="false"
            :before-upload="beforeLogoUpload"
          >
            <img v-if="basicForm.siteLogo" :src="basicForm.siteLogo" class="logo-preview" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="页脚文字">
          <el-input v-model="basicForm.footerText" placeholder="请输入页脚文字" />
        </el-form-item>
        <el-form-item label="ICP备案">
          <el-input v-model="basicForm.icp" placeholder="请输入ICP备案号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSaveBasic">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span>个人信息</span>
      </template>
      <el-form :model="profileForm" label-width="100px" style="max-width: 600px">
        <el-form-item label="昵称">
          <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar-preview" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input
            v-model="profileForm.bio"
            type="textarea"
            :rows="3"
            placeholder="请输入个人简介"
          />
        </el-form-item>
        <el-form-item label="GitHub">
          <el-input v-model="profileForm.github" placeholder="请输入 GitHub 地址" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="savingProfile" @click="handleSaveProfile">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span>修改密码</span>
      </template>
      <el-form :model="passwordForm" label-width="100px" style="max-width: 600px">
        <el-form-item label="当前密码">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            show-password
            placeholder="请输入当前密码"
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="changingPassword" @click="handleChangePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 安全设置：两步验证 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span>安全设置</span>
      </template>
      <div class="twofa-section">
        <!-- 未开启 -->
        <div v-if="!twoFactorStatus.enabled" class="twofa-status">
          <div class="twofa-info">
            <span class="twofa-label">两步验证（TOTP）</span>
            <span class="twofa-desc">未开启 — 使用 Google Authenticator 增强账号安全</span>
          </div>
          <el-button type="primary" :loading="twoFactorLoading" @click="openBindDialog">开启两步验证</el-button>
        </div>
        <!-- 已开启 -->
        <div v-else class="twofa-status">
          <div class="twofa-info">
            <span class="twofa-label">两步验证（TOTP）</span>
            <el-tag type="success" size="small">已开启</el-tag>
            <span class="twofa-backup">备用码剩余 {{ twoFactorStatus.backupCodesRemaining }}/10</span>
            <el-tag v-if="twoFactorStatus.backupCodesRemaining <= 3" type="warning" size="small">备用码不足，建议解绑重绑</el-tag>
          </div>
          <el-button type="danger" plain @click="disableDialogVisible = true">关闭</el-button>
        </div>
      </div>
    </el-card>

    <!-- 绑定弹窗 -->
    <el-dialog v-model="bindDialogVisible" title="开启两步验证" width="480px" :close-on-click-modal="false" @closed="onBindDialogClosed">
      <!-- 步骤 1：扫码 + 动态码 -->
      <div v-if="bindStep === 'qr'" class="bind-qr-step">
        <p class="bind-tip">1. 用 Google Authenticator 扫描下方二维码</p>
        <div class="qr-container">
          <canvas ref="qrCanvasRef" />
          <div v-if="!qrUri" class="qr-loading">加载中...</div>
        </div>
        <el-button text @click="refreshQr">刷新二维码</el-button>
        <p class="bind-tip" style="margin-top: 16px">2. 输入 App 显示的 6 位动态码</p>
        <div class="otp-inputs">
          <input
            v-for="i in 6"
            :key="i"
            :ref="(el) => setOtpRef(el, i - 1)"
            v-model="otpDigits[i - 1]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="otp-cell"
            @input="onOtpInput(i - 1)"
            @keydown.delete="onOtpDelete(i - 1)"
            @paste="onOtpPaste"
          />
        </div>
        <div class="bind-actions">
          <el-button @click="bindDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="binding" @click="handleEnable">确认绑定</el-button>
        </div>
      </div>
      <!-- 步骤 2：备用码展示（仅一次） -->
      <div v-else class="bind-backup-step">
        <el-alert type="warning" :closable="false" show-icon>
          <span>⚠️ 此为唯一一次展示，关闭后无法再查看。请妥善保存备用码。</span>
        </el-alert>
        <div class="backup-codes-grid">
          <div v-for="(code, i) in backupCodes" :key="i" class="backup-code-item">{{ code }}</div>
        </div>
        <div class="backup-actions">
          <el-button @click="copyBackupCodes">复制全部</el-button>
          <el-button @click="downloadBackupCodes">下载文本</el-button>
        </div>
        <el-checkbox v-model="savedConfirmed" style="margin: 12px 0">我已妥善保存备用码</el-checkbox>
        <div class="bind-actions">
          <el-button type="primary" :disabled="!savedConfirmed" @click="finishBind">完成</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 解绑弹窗 -->
    <el-dialog v-model="disableDialogVisible" title="关闭两步验证" width="420px" :close-on-click-modal="false" @closed="disablePassword = ''">
      <el-form @submit.prevent>
        <el-form-item label="登录密码">
          <el-input
            v-model="disablePassword"
            type="password"
            show-password
            placeholder="请输入登录密码以确认"
            @keyup.enter="handleDisable"
          />
        </el-form-item>
      </el-form>
      <div class="bind-actions">
        <el-button @click="disableDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="disabling" @click="handleDisable">确认关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api/auth'
import { request } from '@/api/request'

const userStore = useUserStore()
const saving = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)

const basicForm = reactive({
  siteName: '',
  siteDescription: '',
  siteKeywords: '',
  siteLogo: '',
  footerText: '',
  icp: ''
})

const profileForm = reactive({
  nickname: '',
  avatar: '',
  bio: '',
  github: '',
  email: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

async function loadSettings() {
  try {
    console.log('Loading settings...')
    const settings = await request.get('/api/admin/settings')
    
    if (settings) {
      basicForm.siteName = settings.siteName || ''
      basicForm.siteDescription = settings.siteDescription || ''
      basicForm.siteKeywords = settings.siteKeywords || ''
      basicForm.siteLogo = settings.siteLogo || ''
      basicForm.footerText = settings.footerText || ''
      basicForm.icp = settings.icp || ''
      
      console.log('Basic form updated:', basicForm)
      
      if (settings.socialLinks) {
        try {
          const social = typeof settings.socialLinks === 'string' 
            ? JSON.parse(settings.socialLinks) 
            : settings.socialLinks
          profileForm.github = social.github || ''
          profileForm.email = social.email || ''
          console.log('Social links loaded:', social)
        } catch (e) {
          console.error('Failed to parse socialLinks:', e)
        }
      }
      
      // 从系统设置加载用户信息
      if (settings.userAvatar) {
        profileForm.avatar = settings.userAvatar
      }
      if (settings.userNickname) {
        profileForm.nickname = settings.userNickname
      }
      if (settings.userBio) {
        profileForm.bio = settings.userBio
      }
    }
    
    // 如果系统设置中没有，从用户信息加载
    if (!profileForm.nickname && userStore.user) {
      profileForm.nickname = userStore.user.nickname || ''
    }
    if (!profileForm.avatar && userStore.user) {
      profileForm.avatar = userStore.user.avatar || ''
    }
    if (!profileForm.bio && userStore.user) {
      profileForm.bio = userStore.user.bio || ''
    }
    
    console.log('User profile loaded:', profileForm)
  } catch (error) {
    console.error('Failed to load settings:', error)
    ElMessage.error('加载设置失败')
  }
}

async function handleSaveBasic() {
  saving.value = true
  try {
    await request.put('/api/admin/settings', {
      siteName: basicForm.siteName,
      siteDescription: basicForm.siteDescription,
      siteKeywords: basicForm.siteKeywords,
      siteLogo: basicForm.siteLogo,
      footerText: basicForm.footerText,
      icp: basicForm.icp
    })
    ElMessage.success('基本设置已保存')
  } catch (error) {
    console.error('Failed to save settings:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleSaveProfile() {
  savingProfile.value = true
  try {
    console.log('Saving profile:', profileForm)
    
    // 所有个人信息保存到系统设置
    await request.put('/api/admin/settings', {
      socialLinks: JSON.stringify({
        github: profileForm.github,
        email: profileForm.email
      }),
      userAvatar: profileForm.avatar,
      userNickname: profileForm.nickname,
      userBio: profileForm.bio
    })
    
    // 更新本地用户信息
    if (userStore.user) {
      userStore.user.nickname = profileForm.nickname
      userStore.user.avatar = profileForm.avatar
      userStore.user.email = profileForm.email
      userStore.user.bio = profileForm.bio
    }
    
    ElMessage.success('个人信息已保存')
  } catch (error) {
    console.error('Failed to save profile:', error)
    ElMessage.error('保存失败')
  } finally {
    savingProfile.value = false
  }
}

async function handleChangePassword() {
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请填写完整的密码信息')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  if (passwordForm.newPassword === passwordForm.currentPassword) {
    ElMessage.warning('新密码不能与当前密码相同')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }
  
  changingPassword.value = true
  try {
    await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    ElMessage.success('密码修改成功')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    changingPassword.value = false
  }
}

async function beforeLogoUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  try {
    const response = await request.upload('/api/admin/upload', file)
    basicForm.siteLogo = response.url
    ElMessage.success('Logo上传成功')
  } catch (error) {
    ElMessage.error('Logo上传失败')
  }
  return false
}

async function beforeAvatarUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  try {
    const result = await authApi.uploadAvatar(file)
    console.log('Avatar upload result:', result)
    profileForm.avatar = result.imgUrl || result.url
    ElMessage.success('头像上传成功')
  } catch (error) {
    console.error('Avatar upload error:', error)
    ElMessage.error('头像上传失败')
  }
  return false
}

// ===== 两步验证（2FA / TOTP）=====
const twoFactorStatus = reactive({ enabled: false, backupCodesRemaining: 0 })
const twoFactorLoading = ref(false)

// 绑定弹窗
const bindDialogVisible = ref(false)
const bindStep = ref<'qr' | 'backup'>('qr')
const qrUri = ref('')
const qrCanvasRef = ref<HTMLCanvasElement>()
const otpDigits = ref<string[]>(['', '', '', '', '', ''])
const otpRefs = ref<HTMLInputElement[]>([])
const otpCode = computed(() => otpDigits.value.join(''))
const binding = ref(false)
const backupCodes = ref<string[]>([])
const savedConfirmed = ref(false)

// 解绑弹窗
const disableDialogVisible = ref(false)
const disablePassword = ref('')
const disabling = ref(false)

async function loadTwoFactorStatus() {
  twoFactorLoading.value = true
  try {
    const res = await authApi.getTwoFactorStatus()
    twoFactorStatus.enabled = res.enabled
    twoFactorStatus.backupCodesRemaining = res.backupCodesRemaining
  } catch (error) {
    console.error('Failed to load 2FA status:', error)
  } finally {
    twoFactorLoading.value = false
  }
}

async function openBindDialog() {
  bindStep.value = 'qr'
  resetOtp()
  backupCodes.value = []
  savedConfirmed.value = false
  qrUri.value = ''
  bindDialogVisible.value = true
  await refreshQr()
}

async function refreshQr() {
  try {
    const res = await authApi.setupTwoFactor()
    qrUri.value = res.qrUri
    await nextTick()
    renderQr()
  } catch (error) {
    console.error('Failed to setup 2FA:', error)
    ElMessage.error('获取二维码失败')
  }
}

function renderQr() {
  if (qrCanvasRef.value && qrUri.value) {
    QRCode.toCanvas(qrCanvasRef.value, qrUri.value, { width: 220, margin: 1 }, (err: Error | null | undefined) => {
      if (err) console.error('QR render error:', err)
    })
  }
}

async function handleEnable() {
  if (binding.value) return
  if (otpCode.value.length !== 6) {
    ElMessage.warning('请输入 6 位动态码')
    return
  }
  binding.value = true
  try {
    const res = await authApi.enableTwoFactor(otpCode.value)
    backupCodes.value = res.backupCodes
    bindStep.value = 'backup'
    ElMessage.success('绑定成功，请保存备用码')
  } catch (error: any) {
    handleBindError(error)
  } finally {
    binding.value = false
  }
}

// 绑定错误处理（文档 §5.3）：拦截器已弹 msg，这里只做状态管理
function handleBindError(error: any) {
  const errorCode = error?.errorCode
  if (errorCode === 'two.factor.invalid') {
    resetOtp()
    nextTick(() => otpRefs.value[0]?.focus())
  } else if (errorCode === 'two.factor.expired') {
    resetOtp()
    ElMessage.warning('二维码已过期，正在刷新')
    refreshQr()
  }
}

function finishBind() {
  bindDialogVisible.value = false
  loadTwoFactorStatus()
}

function onBindDialogClosed() {
  bindStep.value = 'qr'
  qrUri.value = ''
  resetOtp()
  backupCodes.value = []
  savedConfirmed.value = false
}

// OTP 6 位分离输入交互
function setOtpRef(el: Element | any, index: number) {
  if (el) otpRefs.value[index] = el as HTMLInputElement
}

function onOtpInput(i: number) {
  const val = otpDigits.value[i]
  if (val && !/\d/.test(val)) {
    otpDigits.value[i] = ''
    return
  }
  if (val && i < 5) otpRefs.value[i + 1]?.focus()
  if (i === 5 && otpDigits.value.every(d => d)) {
    handleEnable()
  }
}

function onOtpDelete(i: number) {
  if (!otpDigits.value[i] && i > 0) {
    otpRefs.value[i - 1]?.focus()
  }
}

function onOtpPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') || ''
  const digits = text.replace(/\D/g, '').slice(0, 6).split('')
  if (digits.length === 0) return
  digits.forEach((d, idx) => {
    otpDigits.value[idx] = d
  })
  if (digits.length === 6) {
    handleEnable()
  } else {
    otpRefs.value[digits.length]?.focus()
  }
}

function resetOtp() {
  otpDigits.value = ['', '', '', '', '', '']
}

async function copyBackupCodes() {
  try {
    await navigator.clipboard.writeText(backupCodes.value.join('\n'))
    ElMessage.success('备用码已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}

function downloadBackupCodes() {
  const text = `两步验证备用码（${new Date().toLocaleString()}）\n\n${backupCodes.value.join('\n')}\n\n⚠️ 此为唯一一次展示，请妥善保存。`
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'backup-codes.txt'
  a.click()
  URL.revokeObjectURL(url)
}

async function handleDisable() {
  if (!disablePassword.value) {
    ElMessage.warning('请输入登录密码')
    return
  }
  disabling.value = true
  try {
    await authApi.disableTwoFactor(disablePassword.value)
    ElMessage.success('两步验证已关闭')
    disableDialogVisible.value = false
    disablePassword.value = ''
    loadTwoFactorStatus()
  } catch {
    // 拦截器已弹 msg（密码错误），清密码可重试
    disablePassword.value = ''
  } finally {
    disabling.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadTwoFactorStatus()
})
</script>

<style scoped lang="scss">
.settings {
  .logo-uploader,
  .avatar-uploader {
    :deep(.el-upload) {
      width: 100px;
      height: 100px;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: var(--brand-primary);
      }
    }
    
    .logo-preview,
    .avatar-preview {
      width: 100px;
      height: 100px;
      display: block;
      object-fit: cover;
    }
    
    .logo-uploader-icon,
    .avatar-uploader-icon {
      font-size: 28px;
      color: var(--text-placeholder);
      width: 100px;
      height: 100px;
      text-align: center;
      line-height: 100px;
    }
  }

  // ===== 两步验证 =====
  .twofa-section {
    .twofa-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 600px;

      .twofa-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;

        .twofa-label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .twofa-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .twofa-backup {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
    }
  }

  .bind-qr-step,
  .bind-backup-step {
    .bind-tip {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0 0 12px;
    }

    .qr-container {
      width: 220px;
      height: 220px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-raised);
      border-radius: 8px;

      .qr-loading {
        color: var(--text-secondary);
        font-size: 13px;
      }
    }

    .otp-inputs {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin: 12px 0;

      .otp-cell {
        width: 40px;
        height: 48px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        text-align: center;
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        background: var(--surface-raised);
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 20%, transparent);
        }
      }
    }

    .bind-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
  }

  .bind-backup-step {
    .backup-codes-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 16px 0;
      padding: 16px;
      background: var(--surface-raised);
      border-radius: 8px;

      .backup-code-item {
        font-family: 'Courier New', monospace;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 1px;
      }
    }

    .backup-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
  }
}
</style>
