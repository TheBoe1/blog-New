<template>
  <div class="admin-layout">
    <el-container class="admin-container">
      <el-aside :width="isCollapsed ? '64px' : '220px'" class="admin-aside">
        <div class="logo-area">
          <div class="logo-icon">
            <img v-if="siteSettings.siteLogo" :src="siteSettings.siteLogo" alt="Logo" class="logo-img" />
            <span v-else class="gradient-text">{{ siteSettings.siteName?.charAt(0) || 'B' }}</span>
          </div>
          <span v-show="!isCollapsed" class="logo-text">{{ siteSettings.adminTitle || '管理后台' }}</span>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :collapse-transition="false"
          router
          class="admin-menu"
          @select="handleMenuSelect"
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
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="header-left">
            <el-icon 
              class="collapse-btn" 
              @click="isCollapsed = !isCollapsed"
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
                    <el-icon><House /></el-icon>
                    访问前台
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="admin-main">
          <router-view v-slot="{ Component }">
            <transition name="slide-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { settingsApi } from '@/api/stats'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapsed = ref(false)
const siteSettings = ref<Record<string, string>>({})

const activeMenu = computed(() => route.path)

const currentTitle = computed(() => route.meta.title as string)

function handleMenuSelect(index: string) {
  if (index && index.startsWith('/')) {
    router.push(index)
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    siteSettings.value = await settingsApi.getSettings() as Record<string, string>
  } catch (error) {
    console.error('Failed to load settings:', error)
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
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  transition: width 0.3s ease;
  overflow: hidden;

  .logo-area {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
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

    .logo-text {
      color: white;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }
}

.admin-menu {
  border-right: none;
  background: transparent;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    color: rgba(255, 255, 255, 0.7);
    height: 50px;
    line-height: 50px;
    background-color: transparent !important;

    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: white;
    }
  }

  :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
    background: rgba(255, 255, 255, 0.05) !important;
    color: white;
  }

  :deep(.el-sub-menu .el-menu) {
    background: rgba(0, 0, 0, 0.2);
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.3) 0%, transparent 100%) !important;
    color: white;
    border-right: 3px solid #667eea;
  }

  :deep(.el-sub-menu .el-menu-item) {
    padding-left: 50px !important;
    min-width: auto;
    
    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
    }
    
    &.is-active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, transparent 100%) !important;
    }
  }
}

.admin-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #606266;
      transition: color 0.3s ease;

      &:hover {
        color: #667eea;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        color: #303133;
        font-size: 14px;
      }
    }
  }
}

.admin-main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
