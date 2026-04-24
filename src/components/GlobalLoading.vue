<template>
  <Transition name="loading-fade">
    <div v-if="loadingStore.isLoading" class="global-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <svg viewBox="0 0 50 50" class="circular">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              class="path"
            />
          </svg>
        </div>
        <span class="loading-text">{{ loadingStore.loadingText }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
</script>

<style scoped>
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.loading-spinner {
  width: 36px;
  height: 36px;
}

.circular {
  animation: rotate 1.2s linear infinite;
  width: 100%;
  height: 100%;
}

.path {
  stroke: #79bbff;
  stroke-width: 3;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

.loading-text {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
  letter-spacing: 1px;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
