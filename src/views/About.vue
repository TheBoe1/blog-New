<template>
  <div class="about-page">
    <div class="about-hero">
      <div class="avatar-section">
        <el-avatar :size="120" :src="userInfo.avatar">
          {{ userInfo.nickname?.charAt(0) }}
        </el-avatar>
        <h1>{{ userInfo.nickname }}</h1>
        <p class="bio">{{ userInfo.bio }}</p>
      </div>
    </div>

    <div class="about-content">
      <el-card shadow="never" class="info-card">
        <template #header>
          <span>个人信息</span>
        </template>
        <div class="info-list">
          <div class="info-item">
            <label class="label">职业</label>
            <span class="value">{{ userInfo.occupation || '前端开发工程师' }}</span>
          </div>
          <div class="info-item">
            <label class="label">位置</label>
            <span class="value">{{ userInfo.location || '中国' }}</span>
          </div>
          <div class="info-item">
            <label class="label">邮箱</label>
            <span class="value">{{ userInfo.email }}</span>
          </div>
          <div class="info-item">
            <label class="label">GitHub</label>
            <a :href="userInfo.github" target="_blank" class="link">{{ userInfo.github }}</a>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="skills-card">
        <template #header>
          <span>技能标签</span>
        </template>
        <div class="skills-list">
          <div v-for="skill in skills" :key="skill.name" class="skill-item">
            <div class="skill-info">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-level">{{ skill.level }}%</span>
            </div>
            <el-progress 
              :percentage="skill.level" 
              :color="skill.color"
              :show-text="false"
            />
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="timeline-card">
        <template #header>
          <span>经历时间线</span>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="item in timeline"
            :key="item.id"
            :timestamp="item.date"
            placement="top"
            :color="item.color"
          >
            <el-card shadow="hover">
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsApi } from '@/api/stats'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const userInfo = ref({
  nickname: '博主',
  avatar: '',
  bio: '热爱编程，专注于前端开发，喜欢探索新技术',
  occupation: '前端开发工程师',
  location: '中国',
  email: 'admin@example.com',
  github: 'https://github.com'
})

const skills = ref([
  { name: 'Vue.js', level: 90, color: '#42b883' },
  { name: 'TypeScript', level: 85, color: '#3178c6' },
  { name: 'React', level: 75, color: '#61dafb' },
  { name: 'Node.js', level: 70, color: '#68a063' },
  { name: 'CSS/Sass', level: 85, color: '#cc6699' },
  { name: 'Python', level: 60, color: '#3776ab' }
])

const timeline = ref([
  { id: 1, date: '2025-03', title: '开始写技术博客', description: '决定开始记录学习历程，分享技术心得', color: '#667eea' },
])

async function loadSettings() {
  try {
    const settings = await settingsApi.getSettings() as Record<string, string>
    if (settings) {
      if (settings.siteName) {
        userInfo.value.nickname = settings.authorName || settings.siteName
      }
      if (settings.siteDescription) {
        userInfo.value.bio = settings.siteDescription
      }
      if (settings.socialLinks) {
        try {
          const social = JSON.parse(settings.socialLinks)
          userInfo.value.github = social.github || userInfo.value.github
          userInfo.value.email = social.email || userInfo.value.email
        } catch (e) {
          console.error('Failed to parse social links:', e)
        }
      }
    }
    
    if (userStore.user) {
      userInfo.value.nickname = userStore.user.nickname || userInfo.value.nickname
      userInfo.value.avatar = userStore.user.avatar || userInfo.value.avatar
      userInfo.value.bio = userStore.user.bio || userInfo.value.bio
      userInfo.value.email = userStore.user.email || userInfo.value.email
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.about-page {
  .about-hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 60px 40px;
    text-align: center;
    color: white;
    margin-bottom: 32px;

    .avatar-section {
      h1 {
        font-size: 28px;
        font-weight: 600;
        margin: 20px 0 12px;
      }

      .bio {
        font-size: 16px;
        opacity: 0.9;
        max-width: 400px;
        margin: 0 auto;
      }

      .tech-stack {
        margin-top: 16px;
        font-size: 14px;
        opacity: 0.85;
        letter-spacing: 1px;
      }
    }
  }

  .about-content {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .info-card {
      .info-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .label {
            font-size: 13px;
            color: #909399;
          }

          .value {
            font-size: 15px;
            color: #303133;
          }

          .link {
            font-size: 15px;
            color: #667eea;
          }
        }
      }
    }

    .skills-card {
      .skills-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;

        .skill-item {
          .skill-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;

            .skill-name {
              font-size: 14px;
              color: #303133;
            }

            .skill-level {
              font-size: 13px;
              color: #909399;
            }
          }
        }
      }
    }

    .timeline-card {
      :deep(.el-timeline-item__timestamp) {
        color: #909399;
      }

      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 8px;
      }

      p {
        font-size: 14px;
        color: #606266;
        margin: 0;
      }
    }
  }
}
</style>
