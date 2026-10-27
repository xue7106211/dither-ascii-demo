import type { FilterSettings, FilterKind, PaletteId } from './types'
import { buildPaletteLut, applyLut } from './palette'
import { sampleAsset, type SampleFrame } from './sample'
import { renderAscii } from './ascii'
import { renderDither } from './dither'
import { drawMask } from './mask'
import { luminance } from './math'

export type RenderOpts = {
  source: CanvasImageSource
  srcW: number
  srcH: number
  boxW: number
  boxH: number
  dpr: number
  filter: FilterKind
  settings: FilterSettings
  theme: 'light' | 'dark'
  /** Previous frame canvas for 150ms cross-fade (filter/palette change). */
  previous?: HTMLCanvasElement | null
  fadeT?: number // 0 = full previous, 1 = full current
}

export function renderEffect(
  canvas: HTMLCanvasElement,
  opts: RenderOpts,
): HTMLCanvasElement {
  const { boxW, boxH, dpr, filter, settings, theme } = opts
  const w = Math.min(2048, Math.max(1, Math.round(boxW * dpr)))
  const h = Math.min(2048, Math.max(1, Math.round(boxH * dpr)))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }

  const lut = buildPaletteLut(settings.palette)
  const mapPixel = lut
    ? (r: number, g: number, b: number, L: number) => applyLut(r, g, b, lut, L)
    : undefined

  const frame: SampleFrame = sampleAsset(opts.source, opts.srcW, opts.srcH, mapPixel)

  // Work in CSS pixels via transform
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, boxW, boxH)

  if (filter === 'ascii') {
    // Order: recolored picture, mask, characters
    drawRecolored(ctx, frame, boxW, boxH, settings.palette)
    drawMask(ctx, boxW, boxH, settings.mask, theme)
    renderAscii(ctx, frame, boxW, boxH, settings)
  } else {
    // Dither: dithered picture, then mask
    renderDither(ctx, frame, boxW, boxH, settings, dpr)
    drawMask(ctx, boxW, boxH, settings.mask, theme)
  }

  // Cross-fade from previous
  if (opts.previous && opts.fadeT !== undefined && opts.fadeT < 1) {
    const t = opts.fadeT
    ctx.save()
    ctx.globalAlpha = 1 - t
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(opts.previous, 0, 0, w, h)
    ctx.restore()
  }

  return canvas
}

function drawRecolored(
  ctx: CanvasRenderingContext2D,
  frame: SampleFrame,
  boxW: number,
  boxH: number,
  palette: PaletteId,
) {
  // For original palette, the underlying <img>/<video> shows through;
  // we still draw a subtle recolored layer when a palette is active.
  if (palette === 'original') return
  const off = document.createElement('canvas')
  off.width = frame.width
  off.height = frame.height
  const octx = off.getContext('2d')!
  const copy = new Uint8ClampedArray(frame.data)
  octx.putImageData(new ImageData(copy, frame.width, frame.height), 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(off, 0, 0, frame.width, frame.height, 0, 0, boxW, boxH)
  void luminance
}
