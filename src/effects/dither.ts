import type { FilterSettings } from './types'
import { clamp, range, luminance } from './math'
import { readSample, type SampleFrame } from './sample'

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export function renderDither(
  ctx: CanvasRenderingContext2D,
  frame: SampleFrame,
  boxW: number,
  boxH: number,
  settings: FilterSettings,
  dpr: number,
) {
  const s = settings.strength / 100
  let pixel = Math.max(2, Math.round(range(settings.size, 2, 9)))
  if (boxW < 720) pixel = Math.min(pixel, 7)
  const patternScale = Math.max(1, Math.round(range(settings.spacing, 1, 4)))
  const levels = Math.max(2, Math.round(range(settings.strength, 8, 2)))
  const blend = range(settings.strength, 0.32, 1)

  const outW = Math.max(1, Math.round(boxW / pixel))
  const outH = Math.max(1, Math.round(boxH / pixel))

  const off = document.createElement('canvas')
  off.width = outW
  off.height = outH
  const octx = off.getContext('2d', { willReadFrequently: true })!
  const img = octx.createImageData(outW, outH)
  const data = img.data

  const scaleX = frame.width / outW
  const scaleY = frame.height / outH

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const sample = readSample(frame, (x + 0.5) * scaleX, (y + 0.5) * scaleY)
      let { r, g, b } = sample
      // push saturation away from luma by 1+0.06+0.18s
      const L255 = luminance(r, g, b) * 255
      const satPush = 1 + 0.06 + 0.18 * s
      r = clamp(L255 + (r - L255) * satPush, 0, 255)
      g = clamp(L255 + (g - L255) * satPush, 0, 255)
      b = clamp(L255 + (b - L255) * satPush, 0, 255)

      const mx = Math.floor(x / patternScale) % 4
      const my = Math.floor(y / patternScale) % 4
      const threshold = (BAYER_4X4[my]![mx]! + 0.5) / 16

      const quantize = (c: number) => {
        const scaled = (c / 255) * (levels - 1)
        const frac = scaled - Math.floor(scaled)
        const q = Math.floor(scaled) + (frac > threshold ? 1 : 0)
        const qClamped = clamp(q, 0, levels - 1)
        const target = (qClamped / (levels - 1)) * 255
        return c + (target - c) * blend
      }

      const i = (y * outW + x) * 4
      data[i] = quantize(r)
      data[i + 1] = quantize(g)
      data[i + 2] = quantize(b)
      data[i + 3] = 255
    }
  }

  octx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = false
  // draw into CSS-pixel space (caller already set transform for DPR)
  void dpr
  ctx.drawImage(off, 0, 0, outW, outH, 0, 0, boxW, boxH)
}
