<template>
  <div class="front-layout">
    <ReadingProgress />

    <!-- Navbar — cnkirito.moe structure -->
    <nav class="navbar navbar-main" :class="{ 'navbar-scrolled': scrolled }">
      <div class="container">
        <!-- Brand: avatar-only logo, centered -->
        <div class="navbar-brand">
          <router-link to="/" class="navbar-item navbar-logo">
            <img
              :src="siteSettings.siteLogo || 'https://oss.lianlab.top/main/img/avatar.jpg'"
              :alt="siteSettings.siteName || '个人博客'"
              height="28"
            />
          </router-link>
        </div>

        <!-- Menu: start (nav links) + end (search icon) -->
        <div class="navbar-menu">
          <div class="navbar-start">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="navbar-item"
              :class="{ 'is-active': isActive(item.path) }"
            >
              {{ item.title }}
            </router-link>

            <!-- Projects dropdown (lexburner-style hover dropdown) -->
            <div
              class="navbar-item has-dropdown"
              :class="{ 'is-active': isProjectsActive }"
              @mouseenter="isProjectsActive = true"
              @mouseleave="isProjectsActive = false"
            >
              <a class="navbar-link" :class="{ 'is-active': isProjectsActive }">
                项目
              </a>
              <div class="navbar-dropdown">
                <router-link
                  v-for="project in projects"
                  :key="project.id"
                  :to="`/project/${project.id}`"
                  class="navbar-item"
                >
                  <div class="navbar-dropdown-item-content">
                    <div class="navbar-dropdown-item-text">
                      <strong>{{ project.name }}</strong>
                      <p>{{ project.description }}</p>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </div>

          <div class="navbar-end">
            <ThemeToggle />
            <a class="navbar-item search" title="搜索" @click="showSearch = true">
              <i class="fas fa-search"></i>
            </a>
            <router-link
              v-if="!userStore.isLoggedIn"
              to="/login"
              class="navbar-item"
              title="登录"
            >
              <i class="fas fa-sign-in-alt"></i>
            </router-link>
            <router-link
              v-else
              to="/admin"
              class="navbar-item"
              title="管理后台"
            >
              <i class="fas fa-cog"></i>
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Search modal -->
    <Teleport to="body">
      <div v-if="showSearch" class="search-modal" @click.self="showSearch = false">
        <div class="search-modal-box">
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            class="search-modal-input"
            :placeholder="searchPlaceholder"
            @keyup.enter="handleSearch"
          />
          <button class="search-modal-close" @click="showSearch = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </Teleport>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-switch" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      <div class="container">
        <div class="level">
          <div class="level-start">
            <router-link to="/" class="footer-logo">
              <img
                :src="siteSettings.siteLogo || 'https://oss.lianlab.top/main/img/avatar.jpg'"
                :alt="siteSettings.siteName || '个人博客'"
                height="28"
              />
            </router-link>
            <p class="copyright">
              <span>&copy; {{ currentYear }} {{ siteSettings.siteName || '个人博客' }}</span>
              &nbsp;&nbsp;Powered by <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue</a>
              &amp; <a href="https://vitejs.dev/" target="_blank" rel="noopener">Vite</a>
            </p>
          </div>
          <div class="level-end">
            <span v-if="siteSettings.icp" class="icp">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
                {{ siteSettings.icp }}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useBlogStore } from '@/stores/blog'
import { settingsApi } from '@/api/stats'
import { useEntranceAnim } from '@/composables/useEntranceAnim'
import { projects as projectList } from '@/data/projects'
import BackToTop from '@/components/BackToTop.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const blogStore = useBlogStore()

const searchKeyword = ref('')
const siteSettings = ref<Record<string, string>>({})
const scrolled = ref(false)
const showSearch = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
let ticking = false

useEntranceAnim()

const navItems = computed(() => [
  { path: '/', title: '主页' },
  { path: '/articles', title: '归档' },
  { path: '/about', title: '关于' }
])

const isProjectsActive = ref(false)
const projects = computed(() => projectList.slice(0, 6))

const currentYear = computed(() => new Date().getFullYear())
const searchPlaceholder = computed(() => siteSettings.value.searchPlaceholder || '搜索文章...')

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleSearch() {
  if (searchKeyword.value.trim()) {
    showSearch.value = false
    router.push({ path: '/articles', query: { keyword: searchKeyword.value } })
    searchKeyword.value = ''
  }
}

function onScroll() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(() => {
    scrolled.value = window.pageYOffset > 100
    ticking = false
  })
}

// Focus search input when modal opens
function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') showSearch.value = false
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onSearchKeydown)
  try {
    siteSettings.value = await settingsApi.getSettings() as Record<string, string>
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onSearchKeydown)
})
</script>

<style scoped lang="scss">
.front-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// ─── Navbar (cnkirito.moe exact structure) ─────────────
.navbar {
  &.navbar-main {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-navbar);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    transition: background 0.3s ease, box-shadow 0.3s ease;

    &.navbar-scrolled {
      background: var(--bg-navbar-scrolled);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .container {
    max-width: var(--content-max-width);
    margin: 0 auto;
    display: flex;
    align-items: stretch;
    min-height: 4rem;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    min-height: 4rem;

    .navbar-logo {
      display: flex;
      align-items: center;
      padding: 0 var(--space-3);

      img {
        max-height: 28px;
        border-radius: var(--radius-sm);
        transition: transform 0.3s ease;
      }

      &:hover img {
        transform: rotate(5deg) scale(1.05);
      }
    }
  }

  .navbar-menu {
    display: flex;
    align-items: stretch;
    flex: 1;
    flex-shrink: 0;
    overflow: visible;
  }

  .navbar-start {
    display: flex;
    align-items: stretch;
    justify-content: flex-start;
    margin-right: auto;
  }

  .navbar-end {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-left: auto;
    gap: var(--space-1);
  }

  // Text nav items — flat, large padding, animated center underline (lexburner signature)
  .navbar-item {
    display: flex;
    align-items: center;
    padding: 1.25rem 0.75rem;
    margin: 0;
    font-size: var(--text-base);
    color: var(--text-secondary);
    text-decoration: none;
    cursor: pointer;
    position: relative;
    transition: color 0.3s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: var(--brand-primary);
      transition: width 0.3s ease, left 0.3s ease;
    }

    &:hover {
      color: var(--brand-primary);
      background: transparent;

      &::after {
        width: 80%;
        left: 10%;
      }
    }

    &.is-active {
      color: var(--brand-primary);
      font-weight: 500;
      background: transparent;

      &::after {
        width: 80%;
        left: 10%;
      }
    }

    // Icon-only items (search/login/cog) — pill bg on hover, no underline
    &.search,
    &[title="登录"],
    &[title="管理后台"] {
      &::after { display: none; }

      &:hover {
        color: var(--brand-primary);
        background: var(--bg-hover);
      }
    }

    // has-dropdown container — no underline, no pill bg
    &.has-dropdown {
      padding: 1.25rem 0.75rem;
      cursor: default;

      &::after { display: none; }
    }
  }

  // Dropdown trigger label
  .navbar-link {
    display: flex;
    align-items: center;
    color: var(--text-secondary);
    text-decoration: none;
    cursor: pointer;
    position: relative;
    transition: color 0.3s ease;

    // Animated underline — sits below the link, grows from center
    &::before {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      width: 0;
      height: 2px;
      background: var(--brand-primary);
      transition: width 0.3s ease, left 0.3s ease;
    }

    &:hover,
    &.is-active {
      color: var(--brand-primary);

      &::before {
        width: 80%;
        left: 10%;
      }
    }
  }

  // Dropdown panel (lexburner signature)
  .has-dropdown {
    position: relative;

    .navbar-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 320px;
      background: var(--bg-overlay);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      border-top: 2px solid var(--brand-primary);
      padding: var(--space-2) 0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
      z-index: 100;

      // Dropdown items — reset navbar-item padding/underline
      .navbar-item {
        display: block;
        padding: var(--space-2) var(--space-4);
        margin: 0;
        border-radius: 0;
        font-size: var(--text-sm);
        color: var(--text-primary);
        white-space: normal;

        &::after { display: none; }

        &:hover {
          background: var(--bg-hover);
          color: var(--brand-primary);
          transform: none;
        }
      }

      .navbar-dropdown-item-content {
        width: 100%;
      }

      .navbar-dropdown-item-text {
        strong {
          display: block;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        p {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-top: 2px;
          line-height: 1.3;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }
    }

    // Show on hover or .is-active (keyboard/touch)
    &:hover .navbar-dropdown,
    &.is-active .navbar-dropdown {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }
}

// ─── Search Modal ──────────────────────────────────────
.search-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
  backdrop-filter: blur(4px);
}

.search-modal-box {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  width: 480px;
  max-width: 90vw;
  display: flex;
  gap: var(--space-3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:focus-within {
    transform: scale(1.02);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
}

.search-modal-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: var(--text-lg);
  font-family: 'Ubuntu', 'PingFang SC', sans-serif;
  color: var(--text-primary);
  background: transparent;
  padding: var(--space-2) 0;

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.search-modal-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: var(--text-xl);
  cursor: pointer;
  padding: 0 var(--space-2);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--text-primary);
  }
}

// ─── Main content ─────────────────────────────────────
.main-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin: 0 auto;
}

// ─── Footer (cnkirito.moe style) ──────────────────────
.footer {
  padding: var(--space-8) var(--space-6);
  border-top: 1px solid var(--border-color);

  .container {
    max-width: var(--content-max-width);
    margin: 0 auto;
  }

  .level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .level-start {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .level-end {
    display: flex;
    align-items: center;
  }

  .footer-logo {
    display: block;
    flex-shrink: 0;

    img {
      max-height: 28px;
      border-radius: var(--radius-sm);
    }
  }

  .copyright {
    font-size: var(--text-xs);
    color: var(--text-tertiary);

    a {
      color: var(--text-tertiary);
      &:hover { color: var(--link-color); }
    }
  }

  .icp {
    font-size: var(--text-xs);
    color: var(--text-tertiary);

    a {
      color: var(--text-tertiary);
      &:hover { color: var(--link-color); }
    }
  }
}

// ─── Responsive ───────────────────────────────────────
@media (max-width: 768px) {
  .navbar-menu {
    display: none;
  }

  // Hide animated underline on touch — no hover state meaningful on mobile
  .navbar-item::after {
    display: none;
  }

  .main-content {
    padding: var(--space-6) var(--space-4);
  }

  .footer {
    padding: var(--space-6) var(--space-4);

    .level {
      flex-direction: column;
      text-align: center;
    }

    .level-start {
      flex-direction: column;
      gap: var(--space-2);
    }
  }
}

// ─── Reduced motion: kill navbar underline + logo rotate ──
@media (prefers-reduced-motion: reduce) {
  .navbar-item::after,
  .navbar-logo img {
    transition: none !important;
  }
}
</style>
