import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { statsApi } from '@/api/stats'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/FrontLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/Articles.vue'),
        meta: { title: '文章列表' }
      },
      {
        path: 'article/:slug',
        name: 'ArticleDetail',
        component: () => import('@/views/ArticleDetail.vue'),
        meta: { title: '文章详情' }
      },
      {
        path: 'category/:id',
        name: 'Category',
        component: () => import('@/views/CategoryArticles.vue'),
        meta: { title: '分类文章' }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { title: '关于我' }
      },
      {
        path: 'project/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/ProjectDetail.vue'),
        meta: { title: '项目详情' }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '控制台' }
      },
      {
        path: 'articles',
        name: 'AdminArticles',
        component: () => import('@/views/admin/ArticleList.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'article/create',
        name: 'AdminArticleCreate',
        component: () => import('@/views/admin/ArticleEditor.vue'),
        meta: { title: '创建文章' }
      },
      {
        path: 'article/edit/:id',
        name: 'AdminArticleEdit',
        component: () => import('@/views/admin/ArticleEditor.vue'),
        meta: { title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/CategoryList.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'tags',
        name: 'AdminTags',
        component: () => import('@/views/admin/TagList.vue'),
        meta: { title: '标签管理' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: 'visit-logs',
        name: 'AdminVisitLogs',
        component: () => import('@/views/admin/VisitLogs.vue'),
        meta: { title: '访问日志' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/Unauthorized.vue'),
    meta: { title: '无权限访问' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  }
})

// 访问统计:停留时长追踪
// - beforeunload:用 fetch + keepalive(关闭/刷新时上报,不丢)
// - 路由切换:走原 fetch(已被 beforeEach 调用)
// - 周期上报:每 60 秒把当前 session 时长同步给后端,覆盖"长时间停留不动"场景
const STAY_DURATION_PING_MS = 60_000

let currentSession: { sessionId: string; enterTime: number } | null = null

function reportDuration() {
  if (currentSession) {
    const duration = Math.round((Date.now() - currentSession.enterTime) / 1000)
    if (duration > 0) {
      statsApi.updateDuration({ sessionId: currentSession.sessionId, duration }).catch(() => {})
    }
    currentSession = null
  }
}

// 关闭/刷新时:用 fetch keepalive,确保请求在 unload 后仍能到达
function reportDurationKeepalive() {
  if (!currentSession) return
  const { sessionId, enterTime } = currentSession
  const duration = Math.round((Date.now() - enterTime) / 1000)
  if (duration <= 0) return
  currentSession = null
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || ''
    fetch(`${baseURL}/api/stats/visit/duration`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, duration }),
      keepalive: true
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}
window.addEventListener('beforeunload', reportDurationKeepalive)

// 周期上报:长时间停留不动时也能更新 stay_duration
const pingTimer = window.setInterval(() => {
  if (!currentSession) return
  const { sessionId, enterTime } = currentSession
  const duration = Math.round((Date.now() - enterTime) / 1000)
  if (duration <= 0) return
  // 推进 enterTime,避免下次 ping 重复累计
  currentSession = { sessionId, enterTime: Date.now() }
  statsApi.updateDuration({ sessionId, duration }).catch(() => {})
}, STAY_DURATION_PING_MS)

router.beforeEach((to, _from, next) => {
  reportDuration()
  document.title = `${to.meta.title || '我的博客'} - 个人博客`
  
  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录')
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  if (to.path === '/login') {
    const userStore = useUserStore()
    if (userStore.isLoggedIn && userStore.isAdmin) {
      next({ path: '/admin' })
      return
    }
  }
  
  next()
})

// 访问统计:公开页面访问记录(fire-and-forget,失败静默,不阻塞导航)
// 仅统计公开页面,跳过管理端/登录/无权限页;同路径不重复计
let lastVisitPath = ''
router.afterEach((to) => {
  if (to.path.startsWith('/admin') || to.path === '/login' || to.path === '/unauthorized') {
    return
  }
  if (to.path === lastVisitPath) {
    return
  }
  lastVisitPath = to.path
  statsApi
    .recordVisit({
      url: window.location.href,
      path: to.path,
      title: (to.meta.title as string) || document.title,
      referer: document.referrer || undefined,
      timestamp: Date.now()
    })
    .then((res) => {
      currentSession = { sessionId: res.sessionId, enterTime: Date.now() }
    })
    .catch(() => {
      // 统计失败不影响正常浏览
    })
})

export default router
