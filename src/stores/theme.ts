import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('theme')
  const isDark = ref(saved === 'dark')

  function apply() {
    const el = document.documentElement
    el.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    // Element Plus 暗色模式依赖 .dark 类名（.dark .el-xxx 选择器）
    el.classList.toggle('dark', isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, (val) => {
    localStorage.setItem('theme', val ? 'dark' : 'light')
    apply()
  }, { immediate: true })

  return { isDark, toggle, apply }
})
