<template>
  <div class="unauthorized-container">
    <div class="unauthorized-content">
      <div class="icon-wrapper">
        <el-icon :size="80" color="#f56c6c">
          <Lock />
        </el-icon>
      </div>
      <h1 class="title">无权限访问</h1>
      <p class="description">抱歉，您没有权限访问此页面</p>
      <p class="detail">您的账号权限不足，或者登录已过期。请重新登录以获取适当的访问权限。</p>
      <div class="actions">
        <el-button type="primary" size="large" @click="handleBackToLogin">
          <el-icon><User /></el-icon>
          返回登录页面
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'

const router = useRouter()

function handleBackToLogin() {
  // 清除本地存储的用户信息
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // 跳转到登录页面
  router.push('/login')
}
</script>

<style scoped lang="scss">
.unauthorized-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.unauthorized-content {
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.icon-wrapper {
  margin-bottom: 30px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20px;
}

.description {
  font-size: 18px;
  color: #606266;
  margin-bottom: 15px;
  font-weight: 500;
}

.detail {
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
  margin-bottom: 40px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  
  .el-button {
    padding: 12px 30px;
    font-size: 16px;
  }
}
</style>
