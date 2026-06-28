<template>
  <button
    class="theme-toggle navbar-item"
    :title="isDark ? '切换亮色模式' : '切换暗色模式'"
    @click="theme.toggle()"
  >
    <span v-if="isDark" class="theme-icon i-ep-sunny" />
    <span v-else class="theme-icon i-ep-moon" />
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
  font-size: 18px;
}
</style>
