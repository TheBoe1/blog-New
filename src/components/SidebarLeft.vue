<template>
  <aside class="column column-left">
    <div class="card widget">
      <div class="card-content">
        <div class="profile">
          <figure class="profile-avatar">
            <img :src="profile.avatar" :alt="profile.name" />
          </figure>
          <p class="profile-name">{{ profile.name }}</p>
          <p class="profile-role">{{ profile.role }}</p>
          <p class="profile-location">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ profile.location }}</span>
          </p>
        </div>
        <nav class="profile-stats">
          <div class="profile-stat">
            <p class="profile-stat-heading">文章</p>
            <router-link to="/articles" class="profile-stat-value">{{ stats.articleCount }}</router-link>
          </div>
          <div class="profile-stat">
            <p class="profile-stat-heading">分类</p>
            <router-link to="/articles" class="profile-stat-value">{{ stats.categoryCount }}</router-link>
          </div>
          <div class="profile-stat">
            <p class="profile-stat-heading">标签</p>
            <router-link to="/articles" class="profile-stat-value">{{ stats.tagCount }}</router-link>
          </div>
        </nav>
        <div class="profile-social">
          <a v-for="s in socials" :key="s.title" :href="s.url" :title="s.title" target="_blank" rel="noopener" class="profile-social-btn">
            <i :class="s.icon"></i>
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBlogStore } from '@/stores/blog'

const blogStore = useBlogStore()

const profile = computed(() => ({
  name: 'Boe',
  role: '',
  location: '中国·石家庄',
  avatar: 'https://oss.lianlab.top/main/img/avatar.jpg'
}))

const socials = [
  { title: 'GitHub', url: 'https://github.com', icon: 'fab fa-github' },
  { title: 'RSS', url: '/atom.xml', icon: 'fas fa-rss' }
]

const stats = computed(() => ({
  articleCount: blogStore.articleCount || blogStore.articles.length,
  categoryCount: blogStore.categoryCount || blogStore.categories.length,
  tagCount: blogStore.tags.length
}))
</script>

<style scoped lang="scss">
.profile {
  text-align: center;

  .profile-avatar {
    width: 128px;
    height: 128px;
    margin: 0 auto var(--space-3);
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.6);
    box-shadow: var(--shadow-sm);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .profile-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
  }

  .profile-role {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .profile-location {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    .fas { margin-right: 4px; opacity: 0.6; }
  }
}

.profile-stats {
  display: flex;
  justify-content: center;
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-color);

  .profile-stat {
    flex: 1;
    text-align: center;
  }

  .profile-stat-heading {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }

  .profile-stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    text-decoration: none;
    &:hover { color: var(--brand-primary); }
  }
}

.profile-social {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);

  .profile-social-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    background: transparent;
    transition: all 0.3s ease;

    i { transition: transform 0.3s ease; }

    &:hover {
      transform: translateY(-3px) rotate(5deg);
      color: var(--brand-primary);
      border-color: var(--brand-primary);

      i { animation: social-icon-bounce 0.5s ease; }
    }
  }
}

.card {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  color: var(--text-secondary);
  overflow: hidden;
}

.card-content {
  padding: var(--space-6);
}

@keyframes social-icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
</style>
