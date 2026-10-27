import { luminance, percentile } from './math'

export type SampleFrame = {
  width: number
  height: number
  data: Uint8ClampedArray // RGBA after white composite + optional palette
  luminances: Float32Array // per-pixel L 0..1 of post-composite RGB (pre-palette)
  low: number
  high: number
}

const SAMPLE_LONG = 480
const TARGET_SAMPLES = 12_000

/** Cover-fit asset into ~480px long-side canvas, composite over white, sample stats. */
export function sampleAsset(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  mapPixel?: (r: number, g: number, b: number, L: number) => [number, number, number],
): SampleFrame {
  const long = Math.max(srcW, srcH)
  const scale = SAMPLE_LONG / long
  const width = Math.max(1, Math.round(srcW * scale))
  const height = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const luminances = new Float32Array(width * height)

  // Composite any remaining alpha over white, then optional palette map
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const a = data[i + 3]! / 255
    let r = data[i]! * a + 255 * (1 - a)
    let g = data[i + 1]! * a + 255 * (1 - a)
    let b = data[i + 2]! * a + 255 * (1 - a)
    const L = luminance(r, g, b)
    luminances[p] = L
    if (mapPixel) {
      ;[r, g, b] = mapPixel(r, g, b, L)
    }
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }

  // ~12,000 evenly spaced samples for percentile
  const total = width * height
  const step = Math.max(1, Math.floor(total / TARGET_SAMPLES))
  const samples: number[] = []
  for (let i = 0; i < total; i += step) {
    samples.push(luminances[i]!)
  }
  samples.sort((a, b) => a - b)
  const sorted = new Float32Array(samples)
  const low = percentile(sorted, 8)
  const high = percentile(sorted, 92)

  return { width, height, data, luminances, low, high }
}

export function readSample(
  frame: SampleFrame,
  sx: number,
  sy: number,
): { r: number; g: number; b: number; L: number } {
  const x = Math.min(frame.width - 1, Math.max(0, Math.floor(sx)))
  const y = Math.min(frame.height - 1, Math.max(0, Math.floor(sy)))
  const i = (y * frame.width + x) * 4
  const p = y * frame.width + x
  return {
    r: frame.data[i]!,
    g: frame.data[i + 1]!,
    b: frame.data[i + 2]!,
    L: frame.luminances[p]!,
  }
}
