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
                @keyup.enter="handleLogin"
              />
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
          <div class="login-tips">
            <p>测试账号：admin / admin123</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    ElMessage.success('登录成功')
    const redirect = route.query.redirect as string || '/admin'
    router.push(redirect)
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  .login-container {
    display: flex;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 900px;
    width: 100%;
  }

  .login-left {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: white;

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .logo-icon {
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.2);
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
        color: #303133;
        margin: 0 0 32px;
        text-align: center;
      }

      .login-tips {
        margin-top: 20px;
        text-align: center;
        p {
          font-size: 12px;
          color: #909399;
          margin: 0;
        }
      }
    }
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
    }
  }
}
</style>
