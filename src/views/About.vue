<template>
  <div class="about-page">
    <section class="about-header">
      <el-avatar :size="80" :src="userInfo.avatar">
        {{ userInfo.nickname?.charAt(0) }}
      </el-avatar>
      <h1 class="name">{{ userInfo.nickname }}</h1>
      <p class="bio">{{ userInfo.bio }}</p>
    </section>

    <section class="about-section">
      <h2 class="section-title">基本信息</h2>
      <div class="info-grid">
        <div class="info-item" v-if="userInfo.occupation">
          <span class="label">职业</span>
          <span class="value">{{ userInfo.occupation }}</span>
        </div>
        <div class="info-item" v-if="userInfo.location">
          <span class="label">位置</span>
          <span class="value">{{ userInfo.location }}</span>
        </div>
        <div class="info-item" v-if="userInfo.email">
          <span class="label">邮箱</span>
          <span class="value">
            <a :href="`mailto:${userInfo.email}`">{{ userInfo.email }}</a>
          </span>
        </div>
        <div class="info-item" v-if="userInfo.github">
          <span class="label">GitHub</span>
          <span class="value">
            <a :href="userInfo.github" target="_blank" rel="noopener noreferrer">
              {{ formatUrl(userInfo.github) }}
            </a>
          </span>
        </div>
      </div>
    </section>

    <section class="about-section" v-if="skills.length">
      <h2 class="section-title">技能</h2>
      <div class="skills-grid">
        <div v-for="skill in skills" :key="skill.name" class="skill-item">
          <div class="skill-header">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-level">{{ skill.level }}%</span>
          </div>
          <el-progress
            :percentage="skill.level"
            :show-text="false"
            :stroke-width="4"
          />
        </div>
      </div>
    </section>

    <section class="about-section" v-if="timeline.length">
      <h2 class="section-title">经历</h2>
      <div class="timeline">
        <div v-for="item in timeline" :key="item.id" class="timeline-item">
          <span class="timeline-date">{{ item.date }}</span>
          <div class="timeline-content">
            <h4>{{ item.title }}</h4>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>
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
  bio: '热爱编程，专注于前端开发',
  occupation: '',
  location: '',
  email: '',
  github: ''
})

const skills = ref([
  { name: 'Vue.js', level: 90 },
  { name: 'TypeScript', level: 85 },
  { name: 'CSS/Sass', level: 80 }
])

const timeline = ref([
  { id: 1, date: '2024', title: '开始写技术博客', description: '记录学习历程，分享技术心得' }
])

function formatUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

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
          userInfo.value.github = social.github || ''
          userInfo.value.email = social.email || ''
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
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: var(--space-16);
}

.about-header {
  text-align: center;
  padding: var(--space-12) 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--space-12);

  .name {
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--text-primary);
    margin: var(--space-4) 0 var(--space-2);
  }

  .bio {
    font-size: var(--text-base);
    color: var(--text-secondary);
    max-width: 400px;
    margin: 0 auto;
  }
}

.about-section {
  margin-bottom: var(--space-12);

  .section-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-color);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);

  .info-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    .label {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .value {
      font-size: var(--text-sm);
      color: var(--text-primary);

      a {
        color: var(--link-color);

        &:hover {
          color: var(--link-hover-color);
        }
      }
    }
  }
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);

  .skill-item {
    .skill-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-2);

      .skill-name {
        font-size: var(--text-sm);
        color: var(--text-primary);
      }

      .skill-level {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
      }
    }
  }
}

.timeline {
  .timeline-item {
    display: flex;
    gap: var(--space-4);
    padding-bottom: var(--space-6);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 56px;
      top: 24px;
      bottom: 0;
      width: 1px;
      background: var(--border-color);
    }

    &:last-child::before {
      display: none;
    }

    .timeline-date {
      width: 48px;
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .timeline-content {
      flex: 1;

      h4 {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      p {
        font-size: var(--text-sm);
        color: var(--text-secondary);
      }
    }
  }
}

@media (max-width: 640px) {
  .info-grid,
  .skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
