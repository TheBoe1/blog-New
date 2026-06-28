import { onMounted } from 'vue'

const EASE_OUT = 'cubic-bezier(0.22, 0.61, 0.36, 1)'
const FADE_DURATION = 500
const NAVBAR_TRANSLATE_Y = '-100px'

/**
 * First-load entrance animation — port of lexburner's animation.js.
 *
 * Navbar slides down from translateY(-100px) + fade.
 * Section + footer fade in.
 *
 * Per-route page-switch animation is handled by the `page-switch` transition
 * in FrontLayout (old page fades out → blank → new page rises from below +
 * fades in). This composable only fires once on initial FrontLayout mount.
 *
 * Default state (no JS / reduced-motion) is fully visible — the animation is
 * an enhancement layered on top, never gating content visibility.
 *
 * Call once in FrontLayout.
 */
export function useEntranceAnim() {
  onMounted(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const navbar = document.querySelector('.navbar-main') as HTMLElement | null
    const section = document.querySelector('.front-layout .main-content') as HTMLElement | null
    const footer = document.querySelector('.front-layout .footer') as HTMLElement | null

    if (navbar) {
      navbar.style.transition = '0s'
      navbar.style.opacity = '0'
      navbar.style.transform = `translateY(${NAVBAR_TRANSLATE_Y})`
    }
    ;[section, footer].forEach(el => {
      if (el) {
        el.style.transition = '0s'
        el.style.opacity = '0'
      }
    })

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (navbar) {
          navbar.style.opacity = '1'
          navbar.style.transform = 'translateY(0)'
          navbar.style.transition = `opacity ${FADE_DURATION}ms ${EASE_OUT}, transform ${FADE_DURATION}ms ${EASE_OUT}`
        }
        ;[section, footer].forEach(el => {
          if (el) {
            el.style.opacity = '1'
            el.style.transition = `opacity ${FADE_DURATION}ms ${EASE_OUT}`
          }
        })
      })
    })
  })
}
