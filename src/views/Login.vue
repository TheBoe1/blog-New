<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand">
          <div class="logo-icon">
            <span class="gradient-text">B</span>
          </div>
          <h1>个人博客</h1>
        </div>
        <p class="slogan">记录技术成长，分享开发经验</p>
        <div class="features">
          <div class="feature-item">
            <el-icon :size="24"><Edit /></el-icon>
            <span>富文本编辑</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><DataAnalysis /></el-icon>
            <span>数据统计</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><Setting /></el-icon>
            <span>可视化管理</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <el-card shadow="never" class="login-card">
          <!-- 步骤 1：账号密码 + 图形验证码 -->
          <template v-if="step === 'credentials'">
            <h2>管理员登录</h2>
            <el-form :model="loginForm" :rules="rules" ref="formRef">
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="用户名"
                  prefix-icon="User"
                  size="large"
                />
              </el-form-item>
              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="密码"
                  prefix-icon="Lock"
                  size="large"
                  show-password
                />
              </el-form-item>
              <el-form-item prop="code">
                <div class="captcha-row">
                  <el-input
                    v-model="loginForm.code"
                    placeholder="验证码"
                    prefix-icon="Key"
                    size="large"
                    @keyup.enter="handleLogin"
                  />
                  <div class="captcha-img" @click="getCaptcha">
                    <img v-if="captchaImg" :src="captchaImg" alt="验证码" />
                    <el-icon v-else class="loading-icon"><Loading /></el-icon>
                  </div>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  style="width: 100%"
                  :loading="loading"
                  @click="handleLogin"
                >
                  登录
                </el-button>
              </el-form-item>
            </el-form>
          </template>

          <!-- 步骤 2：两步验证 -->
          <template v-else>
            <h2>两步验证</h2>
            <p class="step-tip">
              {{ twoFactorMode === 'totp'
                ? '请输入验证器 App 显示的 6 位动态码'
                : '请输入 12 位备用恢复码' }}
            </p>

            <!-- TOTP 动态码模式 -->
            <div v-if="twoFactorMode === 'totp'" class="totp-section">
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
                  :autofocus="i === 1"
                  @input="onOtpInput(i - 1)"
                  @keydown.delete="onOtpDelete(i - 1)"
                  @paste="onOtpPaste"
                />
              </div>
              <el-button
                type="primary"
                size="large"
                class="verify-btn"
                :loading="loading"
                @click="handleVerify"
              >
                验证
              </el-button>
            </div>

            <!-- 备用码模式 -->
            <div v-else class="backup-section">
              <el-input
                v-model="backupCode"
                placeholder="12 位备用码"
                prefix-icon="Key"
                size="large"
                maxlength="12"
                @input="onBackupInput"
                @keyup.enter="handleBackup"
              />
              <el-button
                type="primary"
                size="large"
                class="verify-btn"
                :loading="loading"
                @click="handleBackup"
              >
                验证
              </el-button>
            </div>

            <div class="switch-mode">
              <a v-if="twoFactorMode === 'totp'" @click="switchMode('backup')">使用备用码</a>
              <a v-else @click="switchMode('totp')">使用动态码</a>
            </div>

            <div class="back-to-login">
              <a @click="backToCredentials">← 返回登录</a>
            </div>
          </template>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { request } from '@/api/request'
import type { TwoFactorErrorCode } from '@/types'

type Step = 'credentials' | 'twofa'
type TwoFactorMode = 'totp' | 'backup'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaImg = ref('')
const captchaUuid = ref('')

// 步骤管理
const step = ref<Step>('credentials')
const twoFactorMode = ref<TwoFactorMode>('totp')
// preAuthToken 内存持有，不持久化，刷新页面即丢失（文档 §4.1/§7.5 设计如此）
const preAuthToken = ref('')

// 步骤 1 表单
const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  uuid: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

// 步骤 2：TOTP 6 位码（分离输入框）
const otpDigits = ref<string[]>(['', '', '', '', '', ''])
const otpRefs = ref<HTMLInputElement[]>([])
const otpCode = computed(() => otpDigits.value.join(''))

// 步骤 2：备用码（12 位，自动转大写）
const backupCode = ref('')

// ===== 图形验证码 =====
async function getCaptcha() {
  try {
    const res = await request.get('/captchaImage')
    if (res.code === 200) {
      captchaImg.value = 'data:image/gif;base64,' + res.img
      captchaUuid.value = res.uuid
      loginForm.uuid = res.uuid
    }
  } catch (error) {
    console.error('Failed to get captcha:', error)
  }
}

// ===== 步骤 1：登录（账号密码 + 图形验证码）=====
async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loginForm.uuid = captchaUuid.value
  loading.value = true
  try {
    const result = await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
      code: loginForm.code,
      uuid: loginForm.uuid
    })

    if (result.status === 'NEED_2FA') {
      // 进入二次验证步骤
      preAuthToken.value = result.preAuthToken || ''
      step.value = 'twofa'
      twoFactorMode.value = 'totp'
      resetOtp()
      backupCode.value = ''
      await nextTick()
      otpRefs.value[0]?.focus()
      ElMessage.info('请输入两步验证动态码')
    } else {
      loginSuccess()
    }
  } catch {
    // 步骤 1 错误（密码/验证码错误）：拦截器已弹 msg，这里刷新验证码留步骤 1
    getCaptcha()
    loginForm.code = ''
  } finally {
    loading.value = false
  }
}

// ===== 步骤 2：TOTP 动态码验证 =====
async function handleVerify() {
  if (loading.value) return
  if (otpCode.value.length !== 6) {
    ElMessage.warning('请输入 6 位动态码')
    return
  }
  if (!preAuthToken.value) {
    backToCredentials()
    return
  }

  loading.value = true
  try {
    await userStore.completeTwoFactor(preAuthToken.value, otpCode.value)
    preAuthToken.value = ''
    loginSuccess()
  } catch (error: any) {
    handleTwoFactorError(error)
  } finally {
    loading.value = false
  }
}

// ===== 步骤 2：备用码验证 =====
async function handleBackup() {
  if (loading.value) return
  if (backupCode.value.length !== 12) {
    ElMessage.warning('请输入 12 位备用码')
    return
  }
  if (!preAuthToken.value) {
    backToCredentials()
    return
  }

  loading.value = true
  try {
    await userStore.completeBackup(preAuthToken.value, backupCode.value)
    preAuthToken.value = ''
    loginSuccess()
  } catch (error: any) {
    handleTwoFactorError(error)
  } finally {
    loading.value = false
  }
}

// ===== 2FA 错误处理矩阵（文档 §5.2）=====
// 拦截器已弹后端 i18n msg，这里只做状态管理（清码/清 preAuthToken/跳回步骤1）
function handleTwoFactorError(error: any) {
  const errorCode = error?.errorCode as TwoFactorErrorCode | undefined

  switch (errorCode) {
    case 'two.factor.invalid':
    case 'two.factor.replay':
      // 清码，留步骤 2 可重试
      resetOtp()
      backupCode.value = ''
      nextTick(() => otpRefs.value[0]?.focus())
      break
    case 'two.factor.locked':
    case 'two.factor.expired':
      // preAuthToken 作废/过期，跳回步骤 1
      backToCredentials()
      break
    default:
      // 无 errorCode（CustomException）：
      //   二次验证步骤无 errorCode → 按 expired 处理（文档 §8.1）
      //   兜底跳回步骤 1 重新登录
      backToCredentials()
  }
}

// ===== OTP 输入交互 =====
function setOtpRef(el: Element | any, index: number) {
  if (el) {
    otpRefs.value[index] = el as HTMLInputElement
  }
}

function onOtpInput(i: number) {
  const val = otpDigits.value[i]
  if (val && !/\d/.test(val)) {
    otpDigits.value[i] = ''
    return
  }
  if (val && i < 5) {
    otpRefs.value[i + 1]?.focus()
  }
  // 输完 6 位自动提交
  if (i === 5 && otpDigits.value.every(d => d)) {
    handleVerify()
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
    handleVerify()
  } else {
    otpRefs.value[digits.length]?.focus()
  }
}

function onBackupInput(val: string) {
  // 备用码 12 位 base32，自动转大写（文档 §6.4）
  backupCode.value = val.toUpperCase().replace(/\s/g, '')
}

function resetOtp() {
  otpDigits.value = ['', '', '', '', '', '']
}

function switchMode(mode: TwoFactorMode) {
  twoFactorMode.value = mode
  resetOtp()
  backupCode.value = ''
  if (mode === 'totp') {
    nextTick(() => otpRefs.value[0]?.focus())
  }
}

function backToCredentials() {
  preAuthToken.value = ''
  step.value = 'credentials'
  resetOtp()
  backupCode.value = ''
  getCaptcha()
}

function loginSuccess() {
  ElMessage.success('登录成功')
  const redirect = route.query.redirect as string || '/admin'
  router.push(redirect)
}

onMounted(() => {
  getCaptcha()
})
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-brand);
  padding: 20px;

  .login-container {
    display: flex;
    background: var(--surface-card);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-hover);
    max-width: 900px;
    width: 100%;
  }

  .login-left {
    flex: 1;
    background: var(--gradient-brand);
    padding: 60px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: var(--text-on-brand);

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .logo-icon {
        width: 48px;
        height: 48px;
        background: color-mix(in srgb, var(--text-on-brand) 20%, transparent);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        .gradient-text {
          font-size: 24px;
          font-weight: bold;
        }
      }

      h1 {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
      }
    }

    .slogan {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 15px;
        opacity: 0.9;
      }
    }
  }

  .login-right {
    flex: 1;
    padding: 60px 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    .login-card {
      width: 100%;
      border: none;

      :deep(.el-card__body) {
        padding: 0;
      }

      h2 {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 16px;
        text-align: center;
      }

      .step-tip {
        font-size: 13px;
        color: var(--text-secondary);
        text-align: center;
        margin: 0 0 24px;
        line-height: 1.5;
      }

      .captcha-row {
        display: flex;
        gap: 12px;
        width: 100%;

        .el-input {
          flex: 1;
        }

        .captcha-img {
          width: 120px;
          height: 40px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-raised);

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .loading-icon {
            font-size: 20px;
            color: var(--text-muted);
            animation: spin 1s linear infinite;
          }
        }
      }

      // ===== 两步验证：OTP 输入 =====
      .otp-inputs {
        display: flex;
        gap: 8px;
        justify-content: center;

        .otp-cell {
          width: 44px;
          height: 52px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          text-align: center;
          font-size: 22px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--surface-raised);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;

          &:focus {
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 20%, transparent);
          }
        }
      }

      .verify-btn {
        width: 100%;
        margin-top: 20px;
      }

      .switch-mode {
        margin-top: 16px;
        text-align: center;

        a {
          font-size: 13px;
          color: var(--brand-primary);
          cursor: pointer;
          transition: opacity 0.2s;

          &:hover {
            opacity: 0.8;
          }
        }
      }

      .back-to-login {
        margin-top: 24px;
        text-align: center;

        a {
          font-size: 13px;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;

          &:hover {
            color: var(--text-primary);
          }
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .login-page {
    .login-container {
      flex-direction: column;
    }

    .login-left {
      padding: 40px 30px;
    }

    .login-right {
      padding: 40px 30px;

      .otp-inputs .otp-cell {
        width: 38px;
        height: 46px;
        font-size: 20px;
      }
    }
  }
}
</style>
