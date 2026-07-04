<template>
  <div class="about-page">
    <!-- Hero -->
    <section v-scroll-animate:up class="about-hero">
      <div class="hero-avatar">
        <img v-if="userInfo.avatar" :src="userInfo.avatar" :alt="userInfo.nickname" />
        <span v-else class="hero-avatar-fallback">{{ userInfo.nickname?.charAt(0) || 'B' }}</span>
      </div>
      <h1 class="hero-name">{{ userInfo.nickname || 'Boe' }}</h1>
      <p class="hero-bio">{{ userInfo.bio || '热爱编程，专注于前端开发' }}</p>
      <p class="hero-location" v-if="userInfo.location">
        <i class="fas fa-map-marker-alt" />
        <span>{{ userInfo.location }}</span>
      </p>
    </section>

    <!-- 基本信息 -->
    <section v-scroll-animate:up class="about-section">
      <h2 class="section-title">
        <span class="section-icon"><i class="fas fa-id-card" /></span>
        基本信息
      </h2>
      <div class="info-grid">
        <div v-if="userInfo.occupation" class="info-card">
          <span class="info-icon"><i class="fas fa-briefcase" /></span>
          <span class="info-label">职业</span>
          <span class="info-value">{{ userInfo.occupation }}</span>
        </div>
        <div v-if="userInfo.location" class="info-card">
          <span class="info-icon"><i class="fas fa-map-marker-alt" /></span>
          <span class="info-label">位置</span>
          <span class="info-value">{{ userInfo.location }}</span>
        </div>
        <div v-if="userInfo.email" class="info-card">
          <span class="info-icon"><i class="fas fa-envelope" /></span>
          <span class="info-label">邮箱</span>
          <a class="info-value info-link" :href="`mailto:${userInfo.email}`">{{ userInfo.email }}</a>
        </div>
        <div v-if="userInfo.github" class="info-card">
          <span class="info-icon"><IconMdiGithub /></span>
          <span class="info-label">GitHub</span>
          <a class="info-value info-link" :href="userInfo.github" target="_blank" rel="noopener noreferrer">
            {{ formatUrl(userInfo.github) }}
          </a>
        </div>
      </div>
    </section>

    <!-- 技能 -->
    <section v-if="skills.length" v-scroll-animate:up class="about-section">
      <h2 class="section-title">
        <span class="section-icon"><i class="fas fa-code" /></span>
        技能
      </h2>
      <div class="skills-grid">
        <div v-for="skill in skills" :key="skill.name" class="skill-card">
          <div class="skill-header">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-level">{{ skill.level }}%</span>
          </div>
          <div class="skill-bar">
            <div class="skill-fill" :style="{ width: skill.level + '%' }" />
          </div>
        </div>
      </div>
    </section>

    <!-- 经历 -->
    <section v-if="timeline.length" v-scroll-animate:up class="about-section">
      <h2 class="section-title">
        <span class="section-icon"><i class="fas fa-history" /></span>
        经历
      </h2>
      <div class="timeline">
        <div v-for="item in timeline" :key="item.id" class="timeline-item">
          <div class="timeline-dot" />
          <span class="timeline-date">{{ item.date }}</span>
          <div class="timeline-card">
            <h4 class="timeline-title">{{ item.title }}</h4>
            <p v-if="item.description" class="timeline-desc">{{ item.description }}</p>
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
  nickname: 'Boe',
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
  { name: 'CSS / Sass', level: 80 }
])

const timeline = ref([
  { id: 1, date: '2024', title: '开始写技术博客', description: '记录学习历程，分享技术心得' }
])

function formatUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

async function loadSettings() {
  try {
    const settings = await settingsApi.getSettings() as unknown as Record<string, string>
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
        } catch (_) { /* ignore parse error */ }
      }
    }

    if (userStore.user) {
      userInfo.value.nickname = userStore.user.nickname || userInfo.value.nickname
      userInfo.value.avatar = userStore.user.avatar || userInfo.value.avatar
      userInfo.value.bio = userStore.user.bio || userInfo.value.bio
      userInfo.value.email = userStore.user.email || userInfo.value.email
    }
  } catch (_) { /* ignore fetch error */ }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.about-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-16);
}

// ── Hero ──────────────────────────────────────────────
.about-hero {
  text-align: center;
  padding: var(--space-12) 0 var(--space-10);
  margin-bottom: var(--space-10);
  border-bottom: 1px solid var(--border-color);
}

.hero-avatar {
  width: 96px;
  height: 96px;
  margin: 0 auto var(--space-4);
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--brand-primary);
  box-shadow: 0 0 0 4px var(--brand-tint);
  transition: transform 0.3s ease;

  &:hover { transform: scale(1.05); }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 2rem;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  }
}

.hero-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.hero-bio {
  font-size: var(--text-base);
  color: var(--text-secondary);
  max-width: 360px;
  margin: 0 auto;
  line-height: 1.6;
}

.hero-location {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-tertiary);

  .fas {
    margin-right: 4px;
    opacity: 0.6;
  }
}

// ── Section ───────────────────────────────────────────
.about-section {
  margin-bottom: var(--space-12);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-color);
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--brand-tint);
  color: var(--brand-primary);
  font-size: 0.8rem;
}

// ── Info Cards ────────────────────────────────────────
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-4) var(--space-5);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.info-icon {
  color: var(--brand-primary);
  font-size: 1rem;
  margin-bottom: 2px;
}

.info-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
  word-break: break-all;
}

.info-link {
  color: var(--brand-primary);
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

// ── Skills ────────────────────────────────────────────
.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}

.skill-card {
  padding: var(--space-4) var(--space-5);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
}

.skill-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.skill-level {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: 600;
}

.skill-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

// ── Timeline ──────────────────────────────────────────
.timeline {
  position: relative;
  padding-left: var(--space-8);
}

.timeline-item {
  position: relative;
  padding-bottom: var(--space-6);

  &:last-child { padding-bottom: 0; }
}

.timeline-dot {
  position: absolute;
  left: calc(-1 * var(--space-8) - 4px);
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--brand-primary);
  border: 2px solid var(--bg-primary);
  box-shadow: 0 0 0 3px var(--brand-tint);
  z-index: 1;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--space-8) + 1px);
  top: 20px;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.timeline-date {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--brand-primary);
  background: var(--brand-tint);
  padding: 2px var(--space-3);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.timeline-card {
  padding: var(--space-4) var(--space-5);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-md);
  }
}

.timeline-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

// ── Responsive ────────────────────────────────────────
@media (max-width: 640px) {
  .info-grid,
  .skills-grid {
    grid-template-columns: 1fr;
  }

  .about-hero {
    padding: var(--space-8) 0 var(--space-6);
  }

  .timeline {
    padding-left: var(--space-6);
  }
}
</style>
