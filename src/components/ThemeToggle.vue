<template>
  <button
    class="theme-toggle"
    type="button"
    :title="isDark ? '切换亮色模式' : '切换暗色模式'"
    :aria-label="isDark ? '切换亮色模式' : '切换暗色模式'"
    @click="theme.toggle()"
  >
    <svg v-if="isDark" class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
    <svg v-else class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path class="moon-shape" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'

const theme = useThemeStore()
const { isDark } = storeToRefs(theme)
</script>

<style scoped lang="scss">
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 1.25rem 0.75rem;
  color: var(--text-secondary);
  transition: color 0.3s ease;

  &:hover {
    color: var(--brand-primary);
    background: transparent;
  }
}

.theme-icon {
  display: block;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  overflow: visible;
}

.moon-shape {
  fill: currentColor;
  stroke: none;
}
</style>
