import { clamp } from './math'

/** Vertical gradient mask opacities from mask slider 0..100 and theme. */
export function maskStops(
  mask: number,
  theme: 'light' | 'dark',
): [number, number, number] {
  // Base opacities: light page white 54/20/38%, dark page black 44/20/50%
  const bases = theme === 'light' ? [54, 20, 38] : [44, 20, 50]
  const v = clamp(mask, 0, 100)
  return bases.map((base) => {
    if (v <= 50) {
      return base * Math.pow(v / 50, 1.08)
    }
    return base + (100 - base) * Math.pow((v - 50) / 50, 1.08)
  }) as [number, number, number]
}

export function drawMask(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mask: number,
  theme: 'light' | 'dark',
) {
  const [t, m, b] = maskStops(mask, theme)
  const color = theme === 'light' ? '255,255,255' : '0,0,0'
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, `rgba(${color},${t / 100})`)
  grad.addColorStop(0.42, `rgba(${color},${m / 100})`)
  grad.addColorStop(1, `rgba(${color},${b / 100})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}
