<template>
  <div class="front-layout">
    <ParticleMouseBackground />
    <ReadingProgress />

    <AppNavbar :site-settings="siteSettings" />

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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { settingsApi } from '@/api/stats'
import { useEntranceAnim } from '@/composables/useEntranceAnim'
import BackToTop from '@/components/BackToTop.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import ParticleMouseBackground from '@/components/ParticleMouseBackground.vue'

const route = useRoute()

const siteSettings = ref<Record<string, string>>({})

useEntranceAnim()

const currentYear = computed(() => new Date().getFullYear())

onMounted(async () => {
  try {
    siteSettings.value = await settingsApi.getSettings() as unknown as Record<string, string>
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
})
</script>

<style scoped lang="scss">
.front-layout {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// ─── Main content ─────────────────────────────────────
.main-content {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin: 0 auto;
}

// ─── Footer (cnkirito.moe style) ──────────────────────
.footer {
  position: relative;
  z-index: 1;
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
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);

    a {
      color: var(--text-tertiary);
      &:hover { color: var(--link-color); }
    }
  }

  .icp {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);

    a {
      color: var(--text-tertiary);
      &:hover { color: var(--link-color); }
    }
  }
}

// ─── Responsive ───────────────────────────────────────
@media (max-width: 768px) {
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
</style>
