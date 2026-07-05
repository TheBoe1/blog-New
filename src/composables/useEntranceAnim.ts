import { onMounted, ref, type Ref } from 'vue'

// ease-out-expo: confident deceleration, long tail — reads as "slow, deliberate"
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

interface EntranceOptions {
  /** Entrance duration in ms. Speed control — higher = slower fade-in. Default 1500. */
  duration?: number
  /** px the main content + footer rise from below (bottom-to-top reveal). Default 90. */
  rise?: number
  /** px the navbar starts above its slot (negative = slides down from top). Default -120. */
  navbarOffset?: number
  /** Delay before the entrance fires, ms. Default 0. */
  delay?: number
}

/**
 * First-load entrance animation (Web Animations API).
 *
 * Choreography (bottom-to-top reveal):
 *   - Navbar slides down from translateY(-100px) + fade  (curtain from top)
 *   - Main content + footer rise from translateY(40px) + fade  (curtain from bottom)
 *
 * Why WAAPI over CSS-transition + inline-style:
 *   - `fill: 'both'` snaps the hidden start state before first paint (no flash)
 *     AND holds the visible end state after — no two-step rAF dance, no lingering
 *     inline styles.
 *   - Returns live Animation handles → caller can `playbackRate` (live speed
 *     control), `pause()`, `reverse()`, `cancel()` after the fact.
 *   - Compositor-driven transform+opacity; zero main-thread layout work.
 *   - Zero dependency (browser-native).
 *
 * Default state (no JS / reduced-motion) is fully visible: the animation is an
 * enhancement layered on top, never gating content visibility. Reveals must
 * enhance an already-visible default, not depend on a class that might never
 * fire (hidden tabs / headless renderers pause animations).
 *
 * Fires once on initial FrontLayout mount (first arrival / hard load). Per-route
 * page-switch is handled by the `page-switch` transition in FrontLayout.
 *
 * Call once in FrontLayout. Tune speed via `useEntranceAnim({ duration: 900 })`,
 * or grab the returned animations for live control:
 *   const anims = useEntranceAnim()
 *   anims.value.forEach(a => (a.playbackRate = 1.5))  // speed up live
 */
export function useEntranceAnim(options: EntranceOptions = {}): Ref<Animation[]> {
  const duration = options.duration ?? 1500
  const rise = options.rise ?? 90
  const navbarOffset = options.navbarOffset ?? -120
  const delay = options.delay ?? 0

  const animations = ref<Animation[]>([])

  onMounted(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const navbar = document.querySelector('.navbar-main') as HTMLElement | null
    const section = document.querySelector('.front-layout .main-content') as HTMLElement | null
    const footer = document.querySelector('.front-layout .footer') as HTMLElement | null

    const targets: Array<{ el: HTMLElement | null; offset: number; d: number }> = [
      { el: navbar, offset: navbarOffset, d: delay },
      { el: section, offset: rise, d: delay },
      { el: footer, offset: rise, d: delay + 120 },
    ]

    animations.value = targets
      .map(({ el, offset, d }) => {
        if (!el) return null
        return el.animate(
          [
            { opacity: 0, transform: `translateY(${offset}px)` },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration, easing: EASE_OUT, fill: 'both', delay: d }
        )
      })
      .filter((a): a is Animation => a !== null)
  })

  return animations
}
