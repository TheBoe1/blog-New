<template>
  <div class="admin-layout">
    <el-container class="admin-container">
      <el-aside :width="isCollapsed ? '64px' : '220px'" class="admin-aside">
        <div class="logo-area">
          <div class="logo-icon">
            <img v-if="siteSettings.siteLogo" :src="siteSettings.siteLogo" alt="Logo" class="logo-img" />
            <span v-else>{{ siteSettings.siteName?.charAt(0) || 'B' }}</span>
          </div>
          <span v-show="!isCollapsed" class="logo-text">
            {{ siteSettings.adminTitle || '管理后台' }}
          </span>
        </div>

        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :collapse-transition="false"
          router
          class="admin-menu"
        >
          <el-menu-item index="/admin">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>控制台</template>
          </el-menu-item>

          <el-sub-menu index="article">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>文章管理</span>
            </template>
            <el-menu-item index="/admin/articles">文章列表</el-menu-item>
            <el-menu-item index="/admin/article/create">新建文章</el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/admin/categories">
            <el-icon><Folder /></el-icon>
            <template #title>分类管理</template>
          </el-menu-item>

          <el-menu-item index="/admin/tags">
            <el-icon><PriceTag /></el-icon>
            <template #title>标签管理</template>
          </el-menu-item>

          <el-menu-item index="/admin/settings">
            <el-icon><Setting /></el-icon>
            <template #title>系统设置</template>
          </el-menu-item>

          <el-menu-item index="/admin/page-config">
            <el-icon><EditPen /></el-icon>
            <template #title>页面配置</template>
          </el-menu-item>

          <el-menu-item index="/admin/visit-logs">
            <el-icon><View /></el-icon>
            <template #title>访问日志</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="header-left">
            <el-icon
              class="collapse-btn"
              @click="toggleNavigation"
            >
              <component :is="isCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentTitle">
                {{ currentTitle }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>

          <div class="header-right">
            <ThemeToggle />
            <el-dropdown trigger="click">
              <div class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar">
                  {{ userStore.user?.nickname?.charAt(0) }}
                </el-avatar>
                <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/')">
                    访问前台
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="admin-main">
          <router-view :key="route.fullPath" />
        </el-main>
      </el-container>
    </el-container>

    <el-drawer v-model="mobileDrawerOpen" class="admin-mobile-drawer" direction="ltr" size="280px" :with-header="false" append-to-body>
      <div class="logo-area">
        <div class="logo-icon"><img v-if="siteSettings.siteLogo" :src="siteSettings.siteLogo" alt="Logo" class="logo-img" /><span v-else>{{ siteSettings.siteName?.charAt(0) || 'B' }}</span></div>
        <span class="logo-text">{{ siteSettings.adminTitle || '管理后台' }}</span>
      </div>
      <el-menu :default-active="activeMenu" router class="admin-menu" @select="mobileDrawerOpen = false">
        <el-menu-item index="/admin"><el-icon><DataAnalysis /></el-icon><template #title>控制台</template></el-menu-item>
        <el-sub-menu index="article"><template #title><el-icon><Document /></el-icon><span>文章管理</span></template><el-menu-item index="/admin/articles">文章列表</el-menu-item><el-menu-item index="/admin/article/create">新建文章</el-menu-item></el-sub-menu>
        <el-menu-item index="/admin/categories"><el-icon><Folder /></el-icon><template #title>分类管理</template></el-menu-item>
        <el-menu-item index="/admin/tags"><el-icon><PriceTag /></el-icon><template #title>标签管理</template></el-menu-item>
        <el-menu-item index="/admin/settings"><el-icon><Setting /></el-icon><template #title>系统设置</template></el-menu-item>
        <el-menu-item index="/admin/page-config"><el-icon><EditPen /></el-icon><template #title>页面配置</template></el-menu-item>
        <el-menu-item index="/admin/visit-logs"><el-icon><View /></el-icon><template #title>访问日志</template></el-menu-item>
      </el-menu>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { useUserStore } from '@/stores/user'
import { settingsApi } from '@/api/stats'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapsed = ref(false)
const mobileDrawerOpen = ref(false)
const isMobile = useMediaQuery('(max-width: 768px)')
const siteSettings = ref<Record<string, string>>({})

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title as string)

function toggleNavigation() {
  if (isMobile.value) mobileDrawerOpen.value = true
  else isCollapsed.value = !isCollapsed.value
}

watch(() => route.fullPath, () => { mobileDrawerOpen.value = false })
watch(isMobile, (mobile) => { if (!mobile) mobileDrawerOpen.value = false })

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    siteSettings.value = await settingsApi.getSettings() as unknown as Record<string, string>
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  // Sync user info if not logged in
  if (!userStore.user) {
    await userStore.fetchUserInfo()
  }
})
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.admin-container {
  height: 100%;
}

.admin-aside {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  transition: width var(--transition-base);

  .logo-area {
    height: var(--header-height);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0 var(--space-4);
    border-bottom: 1px solid var(--border-color);

    .logo-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--text-primary);
      border-radius: var(--radius-md);
      flex-shrink: 0;
      overflow: hidden;

      .logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      span {
        color: var(--bg-primary);
        font-weight: 600;
        font-size: var(--font-size-sm);
      }
    }

    .logo-text {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }
  }
}

.admin-menu {
  border-right: none;
  background: transparent;
  padding: var(--space-2) 0;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
    color: var(--text-secondary);
    background-color: transparent;

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  }

  :deep(.el-menu-item.is-active) {
    color: var(--brand-primary);
    background: var(--brand-primary-light);
  }

  :deep(.el-sub-menu .el-menu-item) {
    padding-left: var(--space-8) !important;
    height: 40px;
    line-height: 40px;
  }
}

.admin-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);

    .collapse-btn {
      font-size: var(--font-size-lg);
      cursor: pointer;
      color: var(--text-secondary);
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: color var(--transition-fast), background-color var(--transition-fast);

      &:hover {
        color: var(--text-primary);
        background: var(--bg-hover);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast);

      &:hover {
        background: var(--bg-hover);
      }

      .username {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
      }
    }
  }
}

.admin-main {
  background: var(--bg-secondary);
  padding: var(--space-6);
  overflow-y: auto;
}

:global(.admin-mobile-drawer .el-drawer__body) {
  padding: 0;
  background: var(--bg-secondary);
}

@media (max-width: 768px) {
  .admin-aside { display: none; }
  .admin-header { height: 56px; padding: 0 var(--space-3); }
  .admin-header .header-left { min-width: 0; gap: var(--space-2); }
  .admin-header :deep(.el-breadcrumb) { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .admin-header .header-right { gap: var(--space-1); }
  .admin-header .username { display: none; }
  .admin-main { padding: var(--space-4); }
}
</style>
