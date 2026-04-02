<template>
  <div class="front-layout">
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="router.push('/')">
          <div class="logo-icon">
            <img v-if="siteSettings.siteLogo" :src="siteSettings.siteLogo" alt="Logo" class="logo-img" />
            <span v-else class="gradient-text">{{ siteSettings.siteName?.charAt(0) || 'B' }}</span>
          </div>
          <span class="site-name">{{ siteSettings.siteName || '个人博客' }}</span>
        </div>
        
        <nav class="nav-menu">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </router-link>
        </nav>

        <div class="header-actions">
          <el-autocomplete
            v-model="searchKeyword"
            :fetch-suggestions="handleSearchSuggestions"
            :placeholder="searchPlaceholder"
            prefix-icon="Search"
            clearable
            class="search-input"
            @select="handleSelectArticle"
            @keyup.enter="handleSearch"
          >
            <template #default="{ item }">
              <div class="search-suggestion-item">
                <div class="suggestion-title">{{ item.title }}</div>
                <div class="suggestion-meta">
                  <span class="suggestion-category">{{ item.categoryName }}</span>
                  <span class="suggestion-views">{{ item.viewCount }} 阅读</span>
                </div>
              </div>
            </template>
          </el-autocomplete>
          <el-button 
            v-if="!userStore.isLoggedIn"
            type="primary"
            @click="router.push('/login')"
          >
            登录
          </el-button>
          <el-dropdown v-else trigger="click">
            <div class="user-avatar">
              <el-avatar :size="36" :src="userStore.user?.avatar">
                {{ userStore.user?.nickname?.charAt(0) }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/admin')">
                  <el-icon><Setting /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
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
        <p class="tech-stack">
          {{ techStack }}
        </p>
        <p class="copyright">
          {{ footerText }}
        </p>
        <p v-if="siteSettings.icp" class="icp">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
            {{ siteSettings.icp }}
          </a>
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

interface SearchSuggestion {
  value: string
  title: string
  id: string
  categoryName: string
  viewCount: number
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const blogStore = useBlogStore()

const searchKeyword = ref('')
const siteSettings = ref<Record<string, string>>({})

const navItems = computed(() => {
  const items = [
    { path: '/', title: '首页', icon: 'HomeFilled' },
    { path: '/articles', title: '文章', icon: 'Document' },
    { path: '/projects', title: '项目', icon: 'FolderOpened' },
    { path: '/about', title: '关于', icon: 'User' }
  ]
  return items
})

const currentYear = computed(() => new Date().getFullYear())

const searchPlaceholder = computed(() => {
  return siteSettings.value.searchPlaceholder || '搜索文章...'
})

const techStack = computed(() => {
  return siteSettings.value.techStack || 'Vue · TypeScript · Vite'
})

const footerText = computed(() => {
  if (siteSettings.value.footerText) {
    return siteSettings.value.footerText
  }
  return `© ${currentYear.value} ${siteSettings.value.siteName || '个人博客'}. All rights reserved.`
})

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

async function handleSearchSuggestions(queryString: string, cb: (results: SearchSuggestion[]) => void) {
  if (!queryString.trim()) {
    cb([])
    return
  }
  
  try {
    if (blogStore.articles.length === 0) {
      await blogStore.fetchArticles({})
    }
    
    const keyword = queryString.toLowerCase().trim()
    const suggestions: SearchSuggestion[] = blogStore.articles
      .filter(article => 
        article.title.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword) ||
        article.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
      .slice(0, 5)
      .map(article => ({
        value: article.title,
        title: article.title,
        id: article.id,
        categoryName: article.categoryName,
        viewCount: article.viewCount
      }))
    
    cb(suggestions)
  } catch (error) {
    console.error('Search suggestions error:', error)
    cb([])
  }
}

function handleSelectArticle(item: SearchSuggestion) {
  router.push(`/article/${item.id}`)
  searchKeyword.value = ''
}

function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/articles', query: { keyword: searchKeyword.value } })
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e4e7ed;
  z-index: 1000;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  .logo-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gradient-text {
      color: white;
      font-weight: bold;
      font-size: 18px;
    }
  }

  .site-name {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.nav-menu {
  display: flex;
  gap: 8px;

  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    color: #606266;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      color: #667eea;
      background: #f0f2f5;
    }

    &.active {
      color: #667eea;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;

  .search-input {
    width: 240px;
  }

  .user-avatar {
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.main-content {
  flex: 1;
  margin-top: 60px;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.footer {
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  padding: 24px;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;

    p {
      color: #909399;
      font-size: 13px;
      margin: 4px 0;
    }

    .tech-stack {
      font-size: 12px;
    }

    .icp {
      a {
        color: #909399;
        text-decoration: none;
        &:hover {
          color: #667eea;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.search-suggestion-item {
  padding: 8px 0;
  
  .suggestion-title {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
  }
  
  .suggestion-meta {
    display: flex;
    gap: 12px;
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    
    .suggestion-category {
      color: #667eea;
    }
  }
}
</style>
