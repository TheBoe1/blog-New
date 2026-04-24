import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const requestCount = ref(0)
  const loadingText = ref('加载中')

  const isLoading = computed(() => requestCount.value > 0)

  function showLoading(text: string = '加载中') {
    requestCount.value++
    loadingText.value = text
  }

  function hideLoading() {
    if (requestCount.value > 0) {
      requestCount.value--
    }
  }

  function forceHide() {
    requestCount.value = 0
  }

  return {
    isLoading,
    loadingText,
    showLoading,
    hideLoading,
    forceHide
  }
})
