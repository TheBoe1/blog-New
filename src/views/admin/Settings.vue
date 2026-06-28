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
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api/auth'
import request from '@/api/request'

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
    const response = await request.get('/api/admin/settings')
    console.log('Settings response:', response)
    const settings = response.data || response
    console.log('Settings data:', settings)
    
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
    profileForm.avatar = result.imgUrl || result.url || result
    ElMessage.success('头像上传成功')
  } catch (error) {
    console.error('Avatar upload error:', error)
    ElMessage.error('头像上传失败')
  }
  return false
}

onMounted(() => {
  loadSettings()
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
}
</style>
