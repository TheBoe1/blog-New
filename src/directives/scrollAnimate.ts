import type { Directive, DirectiveBinding } from 'vue'

type Direction = 'up' | 'left' | 'right' | 'scale'

const DIR_CLASS: Record<Direction, string> = {
  up: 'scroll-animate',
  left: 'scroll-animate-left',
  right: 'scroll-animate-right',
  scale: 'scroll-animate-scale'
}

let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('animate-in')
          observer?.unobserve(entry.target)
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    )
  }
  return observer
}

/**
 * v-scroll-animate directive — exact port of scroll-animations.js.
 *
 * Usage:
 *   v-scroll-animate              → scroll-animate (translateY 30px → 0)
 *   v-scroll-animate:left         → scroll-animate-left (translateX -30px → 0)
 *   v-scroll-animate:right        → scroll-animate-right (translateX 30px → 0)
 *   v-scroll-animate:scale        → scroll-animate-scale (scale 0.9 → 1)
 *   v-scroll-animate:up="200"     → stagger delay in ms
 */
export const vScrollAnimate: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const dir: Direction = (binding.arg as Direction) || 'up'
    const delay = Number(binding.value) || 0

    // Delay adding class to avoid conflict with entrance animation (animation.js),
    // which uses inline styles that resolve after ~600ms.
    setTimeout(() => {
      el.classList.add(DIR_CLASS[dir])
    }, delay + 100)

    setTimeout(() => {
      getObserver().observe(el)
    }, delay + 200)
  },
  unmounted(el: HTMLElement) {
    if (observer) observer.unobserve(el)
  }
}
