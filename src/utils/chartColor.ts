/**
 * 图表颜色工具
 *
 * 背景：ECharts 的 Canvas 渲染器不认识 CSS 变量。把 `color: 'var(--text-primary)'`
 * 写进 option 时，`ctx.fillStyle = 'var(--text-primary)'` 会被浏览器判为非法值而丢弃，
 * 画笔沿用上一次的颜色 —— 结果就是文字和它底下的图形同色，肉眼看起来"字没了"。
 * 所以任何需要跟随明暗主题的图表颜色，都必须先在这里解析成具体色值再交给 ECharts。
 */

/** CSS 变量解析失败时的兜底色（对应浅色主题，保证不至于画出不可见文字） */
const THEME_COLOR_FALLBACK: Record<string, string> = {
  '--text-primary': '#363636',
  '--text-secondary': '#4a4a4a',
  '--text-tertiary': '#6b7280',
  '--bg-secondary': '#f4f6fb'
}

const DEFAULT_FALLBACK = '#363636'

/** 把主题变量解析成 ECharts 能直接使用的具体颜色 */
export function resolveThemeColor(varName: string): string {
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const value = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    if (value) return value
  }
  return THEME_COLOR_FALLBACK[varName] || DEFAULT_FALLBACK
}

function parseHex(color: string): [number, number, number] | null {
  const raw = color.replace('#', '').trim()
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return [
      parseInt(raw[0] + raw[0], 16),
      parseInt(raw[1] + raw[1], 16),
      parseInt(raw[2] + raw[2], 16)
    ]
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return [
      parseInt(raw.slice(0, 2), 16),
      parseInt(raw.slice(2, 4), 16),
      parseInt(raw.slice(4, 6), 16)
    ]
  }
  if (/^[0-9a-fA-F]{8}$/.test(raw)) {
    return [
      parseInt(raw.slice(0, 2), 16),
      parseInt(raw.slice(2, 4), 16),
      parseInt(raw.slice(4, 6), 16)
    ]
  }
  return null
}

/** 支持 #rgb / #rrggbb / #rrggbbaa / rgb() / rgba() */
export function toRgb(color: string): [number, number, number] | null {
  if (!color) return null
  const hex = parseHex(color)
  if (hex) return hex

  const matched = color.match(/rgba?\(([^)]+)\)/i)
  if (matched) {
    const parts = matched[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number)
    if (parts.length >= 3 && parts.slice(0, 3).every(n => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]]
    }
  }
  return null
}

/** WCAG 相对亮度，0（纯黑）~ 1（纯白） */
export function relativeLuminance(color: string): number {
  const rgb = toRgb(color)
  if (!rgb) return 1 // 解析不了按浅色处理，配深色描边更安全
  const [r, g, b] = rgb.map(channel => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isLightColor(color: string): boolean {
  return relativeLuminance(color) > 0.45
}

/**
 * 给文字挑一圈与自身明度相反的描边（halo）。
 * 有了这圈描边，文字压在任何颜色的区块上都能读出来 ——
 * 这是"地名颜色必须和地图区块颜色区分开"的关键，比单纯换文字色更稳。
 */
export function textHaloColor(textColor: string): string {
  return isLightColor(textColor) ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)'
}

/**
 * 组装一套"文字 + 对比描边 + 投影"的标签样式，明暗主题通吃。
 *
 * 关键诉求：地名文字必须和地图区块（省份填充色）明显区分开。
 * 省份填充是红/橙/青/蓝紫四种饱和中间色，单靠换文字色很难在所有区块上都够反差，
 * 所以这里给文字套一圈"与自身明度相反"的描边（halo），再叠一层同色柔和投影，
 * 相当于在任何颜色的区块上都先垫了一圈对立色再写字 —— 文字永远压得出来。
 */
export function buildLabelInk(varName = '--text-primary', haloWidth = 3, withShadow = true) {
  const color = resolveThemeColor(varName)
  const halo = textHaloColor(color)
  const ink: Record<string, number | string> = {
    color,
    textBorderColor: halo,
    textBorderWidth: haloWidth
  }
  if (withShadow) {
    ink.textShadowColor = halo
    ink.textShadowBlur = 4
  }
  return ink
}
