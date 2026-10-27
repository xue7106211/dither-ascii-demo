import { ASCII_CHARS, type FilterSettings, type InkTone } from './types'
import {
  clamp,
  range,
  rgbToHsv,
  hsvToRgb,
  smoothstep,
} from './math'
import { readSample, type SampleFrame } from './sample'

function toneFor(
  L: number,
  low: number,
  high: number,
  inkTone: InkTone,
  s: number,
): number {
  const dark = inkTone === 'shadows'
  const raw = dark ? 1 - L : L
  const span = high - low
  let normalized: number
  if (span < 0.025) {
    normalized = raw
  } else {
    normalized = dark ? (high - L) / span : (L - low) / span
    normalized = clamp(normalized, 0, 1)
  }
  const mix = 0.72 + 0.14 * s
  const t = raw * (1 - mix) + normalized * mix
  const black = 0.22 * s
  const white = 1 - 0.08 * s
  const lev = clamp((t - black) / (white - black || 1), 0, 1)
  return lev * (1 - s) + smoothstep(lev) * s
}

function inkColor(
  r: number,
  g: number,
  b: number,
  tone: number,
  s: number,
): { r: number; g: number; b: number; a: number } {
  let [h, sat, val] = rgbToHsv(r, g, b)
  val = val + (1 - val) * (0.24 + 0.18 * s + 0.24 * tone)
  sat = clamp(sat * (1 + 0.16 + 0.2 * s), 0, 1)
  const [nr, ng, nb] = hsvToRgb(h, sat, clamp(val, 0, 1))
  const a = clamp((0.12 + 0.7 * tone) * (0.72 + 0.28 * s), 0.06, 0.94)
  return { r: nr, g: ng, b: nb, a }
}

export function renderAscii(
  ctx: CanvasRenderingContext2D,
  frame: SampleFrame,
  boxW: number,
  boxH: number,
  settings: FilterSettings,
) {
  const s = settings.strength / 100
  let fontPx = Math.round(range(settings.size, 7, 24))
  if (boxW < 720) fontPx = Math.min(fontPx, 22)
  const font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const widest = ctx.measureText('@').width
  const xStep = Math.max(range(settings.spacing, 8, 24), widest * 1.08)
  const atH =
    (ctx.measureText('@').actualBoundingBoxAscent || fontPx * 0.8) +
    (ctx.measureText('@').actualBoundingBoxDescent || fontPx * 0.2)
  const lineH = Math.max(
    range(settings.spacing, 9, 26),
    atH * 1.12,
    fontPx * 1.04,
  )

  const scaleX = frame.width / boxW
  const scaleY = frame.height / boxH

  // first cell half a step in
  for (let y = lineH * 0.5; y < boxH; y += lineH) {
    for (let x = xStep * 0.5; x < boxW; x += xStep) {
      const sample = readSample(frame, x * scaleX, y * scaleY)
      const tone = toneFor(sample.L, frame.low, frame.high, settings.inkTone, s)
      if (tone <= 0.02) continue
      const idx = Math.round(tone * 16)
      const ch = ASCII_CHARS[clamp(idx, 0, 16)]!
      if (ch === ' ') continue
      const ink = inkColor(sample.r, sample.g, sample.b, tone, s)
      ctx.fillStyle = `rgba(${ink.r},${ink.g},${ink.b},${ink.a})`
      ctx.fillText(ch, x, y)
    }
  }
}
