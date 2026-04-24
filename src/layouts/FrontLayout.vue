<template>
  <div class="front-layout">
    <header class="header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <div class="logo-icon">
            <img v-if="siteSettings.siteLogo" :src="siteSettings.siteLogo" alt="Logo" class="logo-img" />
            <span v-else class="logo-text">{{ siteSettings.siteName?.charAt(0) || 'B' }}</span>
          </div>
          <span class="site-name">{{ siteSettings.siteName || '个人博客' }}</span>
        </router-link>

        <nav class="nav-menu">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            {{ item.title }}
          </router-link>
        </nav>

        <div class="header-actions">
          <el-input
            v-model="searchKeyword"
            :placeholder="searchPlaceholder"
            prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <el-button
            v-if="!userStore.isLoggedIn"
            type="primary"
            link
            @click="router.push('/login')"
          >
            登录
          </el-button>
          <el-dropdown v-else trigger="click">
            <div class="user-avatar">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                {{ userStore.user?.nickname?.charAt(0) }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/admin')">
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-main">
          <span class="copyright">
            © {{ currentYear }} {{ siteSettings.siteName || '个人博客' }}
          </span>
          <span v-if="siteSettings.icp" class="icp">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
              {{ siteSettings.icp }}
            </a>
          </span>
        </div>
        <p class="tech-stack">
          {{ techStack }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useBlogStore } from '@/stores/blog'
import { settingsApi } from '@/api/stats'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const blogStore = useBlogStore()

const searchKeyword = ref('')
const siteSettings = ref<Record<string, string>>({})

const navItems = computed(() => [
  { path: '/', title: '首页' },
  { path: '/articles', title: '文章' },
  { path: '/projects', title: '项目' },
  { path: '/about', title: '关于' }
])

const currentYear = computed(() => new Date().getFullYear())

const searchPlaceholder = computed(() => siteSettings.value.searchPlaceholder || '搜索文章...')
const techStack = computed(() => siteSettings.value.techStack || 'Vue · TypeScript · Vite')

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/articles', query: { keyword: searchKeyword.value } })
    searchKeyword.value = ''
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/')
}

onMounted(async () => {
  if (blogStore.articles.length === 0) {
    await blogStore.fetchArticles({})
  }
  try {
    siteSettings.value = await settingsApi.getSettings() as Record<string, string>
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
})
</script>

<style scoped lang="scss">
.front-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);

  .header-content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-6);
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;

  .logo-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--text-primary);
    border-radius: var(--radius-md);
    overflow: hidden;

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-text {
      color: var(--bg-primary);
      font-weight: 600;
      font-size: var(--text-base);
    }
  }

  .site-name {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--text-primary);
  }
}

.nav-menu {
  display: flex;
  gap: var(--space-1);

  .nav-item {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: color var(--transition-fast), background-color var(--transition-fast);

    &:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
    }

    &.active {
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);

  .search-input {
    width: 200px;

    :deep(.el-input__wrapper) {
      border-radius: var(--radius-lg);
    }
  }

  .user-avatar {
    cursor: pointer;
    border-radius: 50%;
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 0.8;
    }
  }
}

.main-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin: 0 auto;
}

.footer {
  border-top: 1px solid var(--border-color);
  padding: var(--space-8) var(--space-6);

  .footer-content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    text-align: center;
  }

  .footer-main {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  .copyright,
  .icp {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .icp a {
    color: var(--text-secondary);

    &:hover {
      color: var(--link-color);
    }
  }

  .tech-stack {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }
}

@media (max-width: 768px) {
  .header {
    .header-content {
      padding: 0 var(--space-4);
    }
  }

  .nav-menu {
    display: none;
  }

  .header-actions {
    .search-input {
      width: 140px;
    }
  }

  .main-content {
    padding: var(--space-6) var(--space-4);
  }

  .footer {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
