import { onMounted } from 'vue'

// ease-out-expo: confident deceleration, long tail — reads as "slow, deliberate"
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

interface EntranceOptions {
  /** Entrance duration in ms. Speed control — higher = slower fade-in. Default 700. */
  duration?: number
  /** px the main content + footer rise from below (bottom-to-top reveal). Default 40. */
  rise?: number
  /** px the navbar starts above its slot (negative = slides down from top). Default -100. */
  navbarOffset?: number
  /** Delay before the entrance fires, ms. Default 0. */
  delay?: number
}

/**
 * First-load entrance animation.
 *
 * Choreography (bottom-to-top reveal):
 *   - Navbar slides down from translateY(-100px) + fade  (curtain from top)
 *   - Main content + footer rise from translateY(40px) + fade  (curtain from bottom)
 *
 * The two move toward each other and settle — one well-rehearsed entrance,
 * not scattered per-section motion (per brand register: editorial-quiet).
 *
 * Per-route page-switch animation is handled by the `page-switch` transition
 * in FrontLayout (old page fades out → new page rises). This composable only
 * fires once on initial FrontLayout mount (i.e. first arrival / hard load).
 *
 * Default state (no JS / reduced-motion) is fully visible — the animation is
 * an enhancement layered on top, never gating content visibility. Reveals
 * must enhance an already-visible default, not depend on a class that might
 * never fire (hidden tabs / headless renderers).
 *
 * Call once in FrontLayout. Tune speed via `useEntranceAnim({ duration: 900 })`.
 */
export function useEntranceAnim(options: EntranceOptions = {}) {
  const duration = options.duration ?? 700
  const rise = options.rise ?? 40
  const navbarOffset = options.navbarOffset ?? -100
  const delay = options.delay ?? 0

  onMounted(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const navbar = document.querySelector('.navbar-main') as HTMLElement | null
    const section = document.querySelector('.front-layout .main-content') as HTMLElement | null
    const footer = document.querySelector('.front-layout .footer') as HTMLElement | null

    // Snap to initial hidden state (0s transition so there's no flash of movement)
    if (navbar) {
      navbar.style.transition = '0s'
      navbar.style.opacity = '0'
      navbar.style.transform = `translateY(${navbarOffset}px)`
    }
    ;[section, footer].forEach(el => {
      if (el) {
        el.style.transition = '0s'
        el.style.opacity = '0'
        el.style.transform = `translateY(${rise}px)`
      }
    })

    // Next frame (+ optional delay): transition to visible
    requestAnimationFrame(() => {
      setTimeout(() => {
        const transition = `opacity ${duration}ms ${EASE_OUT}, transform ${duration}ms ${EASE_OUT}`
        if (navbar) {
          navbar.style.opacity = '1'
          navbar.style.transform = 'translateY(0)'
          navbar.style.transition = transition
        }
        ;[section, footer].forEach(el => {
          if (el) {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
            el.style.transition = transition
          }
        })
      }, delay)
    })
  })
}
