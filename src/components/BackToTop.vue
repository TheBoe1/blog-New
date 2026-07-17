<template>
  <button
    id="back-to-top"
    title="回到顶端"
    :class="btnClass"
    :style="btnStyle"
    @click="scrollTop"
  >
    <i class="i-ep-arrow-up" aria-hidden="true"></i>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const lastScrollTop = ref(0)
const btnClass = ref('card has-text-centered')
const btnStyle = ref<Record<string, string>>({})
let ticking = false

// ─── State definitions (exact port of back_to_top.js) ──────
const base = { width: 64, bottom: 20 }

const stateDesktopHidden = { ...base, className: 'card has-text-centered rise-up' }
const stateDesktopVisible = { ...stateDesktopHidden, className: 'card has-text-centered rise-up fade-in' }
const stateDesktopDock = { ...stateDesktopVisible, className: 'card has-text-centered rise-up fade-in is-rounded', width: 40 }
const stateMobileHidden = { ...base, className: 'card has-text-centered fade-in', right: 20 }
const stateMobileVisible = { ...stateMobileHidden, className: 'card has-text-centered rise-up fade-in' }

function isDesktop() { return window.innerWidth >= 1078 }
function isTablet() { return window.innerWidth >= 768 && !isDesktop() }
function isScrollUp() { return window.scrollY < lastScrollTop.value && window.scrollY > 0 }

function getRightSidebarBottom() {
  const col = document.querySelector('.column-right') as HTMLElement | null
  if (!col) return 0
  const widgets = col.querySelectorAll('.widget')
  return Math.max(...Array.from(widgets).map(w => {
    const r = w.getBoundingClientRect()
    return r.top + r.height + window.scrollY
  }))
}

function applyState(state: Record<string, any>) {
  btnClass.value = state.className
  const css: Record<string, string> = {}
  for (const key of Object.keys(state)) {
    if (key === 'className') continue
    if (typeof state[key] === 'number') css[key] = state[key] + 'px'
    else css[key] = state[key]
  }
  btnStyle.value = css
}

function update() {
  const st = window.scrollY
  const winH = window.innerHeight
  const scrollBottom = st + winH

  if (isDesktop() || (isTablet() && !document.querySelector('.column-left') && document.querySelector('.column-right'))) {
    // Desktop / tablet-with-right-sidebar
    let next: Record<string, any>
    const mainCol = document.querySelector('.column-main') as HTMLElement | null
    const footer = document.querySelector('.footer') as HTMLElement | null
    const padding = mainCol ? (mainCol.offsetWidth - mainCol.clientWidth) / 2 : 0
    const maxLeft = window.innerWidth - 64 - 20 // width - rightMargin
    const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : 0
    const btnH = 48
    const maxBottom = footerTop + btnH / 2 + 20

    if (st === 0 || scrollBottom < getRightSidebarBottom() + padding + btnH) {
      next = stateDesktopHidden
    } else if (scrollBottom < maxBottom) {
      next = stateDesktopVisible
    } else {
      next = { ...stateDesktopDock, bottom: scrollBottom - maxBottom + 20 }
    }

    const left = mainCol
      ? mainCol.getBoundingClientRect().left + mainCol.offsetWidth + padding
      : 0
    next = { ...next, left: Math.min(left, maxLeft) }
    applyState(next)
  } else {
    // Mobile / tablet
    if (!isScrollUp()) {
      applyState(stateMobileHidden)
    } else {
      applyState(stateMobileVisible)
    }
    lastScrollTop.value = st
  }
  ticking = false
}

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(update)
    ticking = true
  }
}

function scrollTop() {
  if (CSS.supports('(scroll-behavior: smooth)')) {
    window.scroll({ top: 0, behavior: 'smooth' })
  } else {
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  }
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<style scoped>
#back-to-top {
  position: fixed;
  opacity: 0;
  outline: none;
  padding: 8px 0;
  line-height: 24px;
  border-radius: 4px;
  transform: translateY(120px);
  transition: 0.4s ease opacity, 0.4s ease width, 0.4s ease transform, 0.4s ease border-radius;
  background: var(--bg-primary);
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  z-index: 1000;
  box-shadow: var(--shadow-sm);
}

#back-to-top.is-rounded {
  border-radius: 50%;
}

#back-to-top.fade-in {
  opacity: 1;
}

#back-to-top.rise-up {
  transform: translateY(0);
}

#back-to-top {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

#back-to-top:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: var(--shadow-hover);
}

#back-to-top:active {
  transform: translateY(-2px) scale(1.05);
}

#back-to-top.fade-in {
  animation: back-to-top-pulse 2s infinite;
}

@keyframes back-to-top-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand-primary) 70%, transparent);
  }
  50% {
    box-shadow: 0 0 0 10px transparent;
  }
}

@media (max-width: 767px) {
  #back-to-top:hover {
    transform: translateY(0) scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  #back-to-top {
    transition: none;
  }
  #back-to-top.fade-in {
    animation: none;
  }
  #back-to-top:hover {
    transform: none;
  }
}
</style>
