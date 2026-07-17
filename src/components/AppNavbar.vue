<template>
  <nav class="navbar navbar-main" :class="{ 'navbar-scrolled': scrolled }">
    <div class="container">
      <!-- Brand: avatar-only logo, centered -->
      <div class="navbar-brand">
        <router-link to="/" class="navbar-item navbar-logo">
          <img
            :src="settings.siteLogo || 'https://oss.lianlab.top/main/img/avatar.jpg'"
            :alt="settings.siteName || '个人博客'"
            width="28"
            height="28"
            decoding="async"
          />
        </router-link>
      </div>

      <button
        class="mobile-menu-toggle"
        type="button"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-navigation"
        aria-label="打开导航菜单"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span class="mobile-menu-toggle__glyph" aria-hidden="true">{{ mobileMenuOpen ? '×' : '☰' }}</span>
      </button>

      <div class="mobile-navbar-actions">
        <ThemeToggle />
        <button type="button" aria-label="搜索" title="搜索" @click="showSearch = true">
          <i class="i-ep-search" aria-hidden="true"></i>
        </button>
        <router-link
          :to="userStore.isLoggedIn ? '/admin' : '/login'"
          :aria-label="userStore.isLoggedIn ? '管理后台' : '登录'"
          :title="userStore.isLoggedIn ? '管理后台' : '登录'"
        >
          <i v-if="userStore.isLoggedIn" class="i-ep-setting" aria-hidden="true"></i>
          <i v-else class="i-mdi-login" aria-hidden="true"></i>
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
            <i class="i-ep-search" aria-hidden="true"></i>
          </a>
          <router-link
            v-if="!userStore.isLoggedIn"
            to="/login"
            class="navbar-item"
            title="登录"
          >
            <i class="i-mdi-login" aria-hidden="true"></i>
          </router-link>
          <router-link
            v-else
            to="/admin"
            class="navbar-item"
            title="管理后台"
          >
            <i class="i-ep-setting" aria-hidden="true"></i>
          </router-link>
        </div>
      </div>
    </div>
  </nav>

  <Teleport to="body">
    <Transition name="mobile-menu">
      <div v-if="mobileMenuOpen" id="mobile-navigation" class="mobile-navigation" @click.self="mobileMenuOpen = false">
        <div class="mobile-navigation__panel">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="mobile-navigation__link"
            :class="{ 'is-active': isActive(item.path) }"
            @click="mobileMenuOpen = false"
          >{{ item.title }}</router-link>
          <button
            class="mobile-navigation__link mobile-navigation__parent"
            type="button"
            :class="{ 'is-active': route.path.startsWith('/project/') }"
            :aria-expanded="mobileProjectsOpen"
            aria-controls="mobile-project-list"
            @click="mobileProjectsOpen = !mobileProjectsOpen"
          >
            <span>项目</span>
            <i class="i-ep-arrow-down mobile-projects-chevron" :class="{ 'is-open': mobileProjectsOpen }" aria-hidden="true"></i>
          </button>
          <Transition name="mobile-submenu">
            <div v-if="mobileProjectsOpen" id="mobile-project-list" class="mobile-navigation__project-list">
              <router-link
                v-for="project in projects"
                :key="project.id"
                :to="`/project/${project.id}`"
                class="mobile-navigation__project"
                @click="mobileMenuOpen = false"
              >
                <strong>{{ project.name }}</strong>
                <span>{{ project.description }}</span>
              </router-link>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>

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
          <i class="i-ep-close" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { projects as projectList } from '@/data/projects'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps<{ siteSettings?: Record<string, string> }>()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchKeyword = ref('')
const scrolled = ref(false)
const showSearch = ref(false)
const mobileMenuOpen = ref(false)
const mobileProjectsOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
let ticking = false

const settings = computed(() => props.siteSettings || {})

const navItems = computed(() => [
  { path: '/', title: '主页' },
  { path: '/articles', title: '归档' },
  { path: '/about', title: '关于' }
])

const isProjectsActive = ref(false)
const projects = computed(() => projectList.slice(0, 6))

const searchPlaceholder = computed(() => settings.value.searchPlaceholder || '搜索文章...')

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

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    showSearch.value = false
    mobileMenuOpen.value = false
  }
}

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
  mobileProjectsOpen.value = false
})

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onSearchKeydown)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onSearchKeydown)
})
</script>

<style scoped lang="scss">
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
    box-shadow: var(--shadow-sm);
    transition: background 0.3s ease, box-shadow 0.3s ease;

    &.navbar-scrolled {
      background: var(--bg-navbar-scrolled);
      box-shadow: var(--shadow-sm);
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
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    text-decoration: none;
    cursor: pointer;
    position: relative;
    transition: color 0.3s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10%;
      width: 80%;
      height: 2px;
      background: var(--brand-primary);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.3s ease;
    }

    &:hover {
      color: var(--brand-primary);
      background: transparent;

      &::after {
        transform: scaleX(1);
      }
    }

    &.is-active {
      color: var(--brand-primary);
      font-weight: 500;
      background: transparent;

      &::after {
        transform: scaleX(1);
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
      left: 10%;
      width: 80%;
      height: 2px;
      background: var(--brand-primary);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.3s ease;
    }

    &:hover,
    &.is-active {
      color: var(--brand-primary);

      &::before {
        transform: scaleX(1);
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
      box-shadow: var(--shadow-md);
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
        font-size: var(--font-size-sm);
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
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        p {
          font-size: var(--font-size-xs);
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
  background: var(--bg-overlay);
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
  box-shadow: var(--shadow-hover);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:focus-within {
    transform: scale(1.02);
    box-shadow: var(--shadow-hover);
  }
}

.search-modal-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: var(--font-size-lg);
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
  font-size: var(--font-size-xl);
  cursor: pointer;
  padding: 0 var(--space-2);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--text-primary);
  }
}

// ─── Responsive ───────────────────────────────────────
@media (max-width: 768px) {
  .navbar .container {
    position: relative;
    width: 100%;
    min-height: 3.75rem;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-3);
  }

  .navbar .navbar-brand {
    position: absolute;
    left: 50%;
    min-height: 3.75rem;
    transform: translateX(-50%);
  }

  .navbar .navbar-brand .navbar-logo {
    padding: 0;
  }

  .navbar .navbar-brand .navbar-logo img {
    width: 34px;
    height: 34px;
    max-height: none;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 3px var(--border-color);
  }

  .navbar .navbar-menu,
  .navbar .navbar-start,
  .navbar .navbar-end {
    display: none !important;
  }

  .mobile-menu-toggle {
    position: absolute;
    left: var(--space-3);
    display: inline-grid;
    place-items: center;
    width: 40px;
    min-width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    color: var(--text-primary);
    background: color-mix(in srgb, var(--bg-primary) 88%, transparent);
    box-shadow: var(--shadow-sm);
    font-size: var(--font-size-base);
    line-height: 1;
    z-index: 2;
    cursor: pointer;
    transition: color var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast);
  }

  .mobile-menu-toggle__glyph {
    font-size: 20px;
    font-weight: var(--font-weight-normal);
    line-height: 1;
  }

  .mobile-navbar-actions {
    position: absolute;
    right: var(--space-3);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .mobile-navbar-actions > button,
  .mobile-navbar-actions > a {
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    color: var(--text-secondary);
    background: transparent;
    font-size: 17px;
    cursor: pointer;
  }

  .mobile-navbar-actions :deep(.theme-toggle .theme-icon) {
    width: 25px;
    height: 25px;
    flex-basis: 25px;
  }

  .mobile-navbar-actions > button:active,
  .mobile-navbar-actions > a:active {
    color: var(--brand-primary);
    background: var(--brand-tint);
  }

  .mobile-menu-toggle:active {
    color: var(--brand-primary);
    border-color: color-mix(in srgb, var(--brand-primary) 45%, transparent);
    background: var(--brand-tint);
  }

  // Hide animated underline on touch — no hover state meaningful on mobile
  .navbar-item::after {
    display: none;
  }
}

@media (min-width: 769px) { .mobile-menu-toggle, .mobile-navbar-actions { display: none; } }

.mobile-navigation {
  position: fixed;
  inset: 60px 0 0;
  z-index: 99;
  width: 100%;
  max-width: 100vw;
  padding: var(--space-3);
  overflow-x: hidden;
  overflow-y: auto;
  background: color-mix(in srgb, var(--bg-page) 68%, transparent);
  backdrop-filter: blur(8px);
}
.mobile-navigation__panel {
  display: grid;
  gap: 2px;
  width: min(100%, 560px);
  min-width: 0;
  margin: 0 auto;
  padding: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  box-shadow: var(--shadow-hover);
}
.mobile-navigation__link {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 var(--space-3);
  color: var(--text-primary);
  border-radius: var(--radius-md);
}
.mobile-navigation__link { width: 100%; gap: var(--space-3); border: 0; background: transparent; font: inherit; text-align: left; cursor: pointer; }
.mobile-navigation__link span { min-width: 0; flex: 1; }
.mobile-navigation__link:active { color: var(--brand-primary); background: var(--brand-tint); }
.mobile-navigation__link.is-active { color: var(--brand-primary); background: var(--brand-tint); }
.mobile-navigation__parent { justify-content: space-between; }
.mobile-navigation__parent .mobile-projects-chevron { flex: 0 0 auto; color: var(--text-tertiary); font-size: var(--font-size-xs); transition: transform var(--motion-normal) var(--ease-standard); }
.mobile-navigation__parent .mobile-projects-chevron.is-open { transform: rotate(180deg); }
.mobile-navigation__project-list { display: grid; gap: 4px; padding: var(--space-1) 0 var(--space-2) var(--space-3); overflow: hidden; }
.mobile-navigation__project { display: grid; gap: 2px; min-width: 0; padding: var(--space-2) var(--space-3); border-left: 2px solid var(--border-color); color: var(--text-primary); }
.mobile-navigation__project strong { overflow: hidden; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.mobile-navigation__project span { overflow: hidden; color: var(--text-tertiary); font-size: var(--font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.mobile-navigation__project:active { color: var(--brand-primary); border-left-color: var(--brand-primary); background: var(--brand-tint); }

.mobile-menu-enter-active, .mobile-menu-leave-active { transition: opacity var(--motion-normal) var(--ease-standard); }
.mobile-menu-enter-active .mobile-navigation__panel,
.mobile-menu-leave-active .mobile-navigation__panel { transition: opacity var(--motion-normal) var(--ease-standard), transform var(--motion-normal) var(--ease-standard); transform-origin: top center; }
.mobile-menu-enter-from, .mobile-menu-leave-to { opacity: 0; }
.mobile-menu-enter-from .mobile-navigation__panel,
.mobile-menu-leave-to .mobile-navigation__panel { opacity: 0; transform: translateY(-14px) scale(0.985); }

.mobile-submenu-enter-active, .mobile-submenu-leave-active {
  will-change: transform, opacity;
  transition: opacity var(--motion-fast) ease, transform var(--motion-normal) var(--ease-standard);
}
.mobile-submenu-enter-from, .mobile-submenu-leave-to { opacity: 0; transform: translateY(-6px) scaleY(0.96); }

// ─── Reduced motion: kill navbar underline + logo rotate ──
@media (prefers-reduced-motion: reduce) {
  .navbar-item::after,
  .navbar-logo img,
  .mobile-navigation__panel,
  .mobile-navigation__parent .mobile-projects-chevron,
  .mobile-navigation__project-list {
    transition: none !important;
  }
}
</style>
