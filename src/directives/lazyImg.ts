import type { Directive, DirectiveBinding } from 'vue'

let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
          }
          const done = () => img.classList.add('loaded')
          if (img.complete) done()
          else img.addEventListener('load', done, { once: true })
          observer?.unobserve(img)
        }
      },
      { rootMargin: '50px' }
    )
  }
  return observer
}

/**
 * v-lazy-img — lazy load images on scroll + fade in.
 * Usage: <img v-lazy-img="src" alt="..." />
 *
 * Matches scroll-animations.js initImageAnimations behavior.
 */
export const vLazyImg: Directive = {
  mounted(el: HTMLImageElement, binding: DirectiveBinding) {
    const src = (binding.value as string) || el.src
    if (!src) return
    el.loading = 'lazy'
    el.decoding = 'async'
    el.classList.add('lazy-load')
    el.dataset.src = src
    el.src = ''
    getObserver().observe(el)
  },
  unmounted(el: HTMLImageElement) {
    if (observer) observer.unobserve(el)
  }
}
