import { PALETTE_POSITIONS, PALETTE_STOPS, type PaletteId } from './types'
import { hexToRgb } from './math'

/** Build a 256-entry RGB LUT that maps luminance 0..1 → palette color. */
export function buildPaletteLut(
  palette: PaletteId,
): Uint8ClampedArray | null {
  if (palette === 'original') return null
  const stops = PALETTE_STOPS[palette]
  const colors = stops.map(hexToRgb)
  const lut = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    let c0 = colors[0]!
    let c1 = colors[1]!
    let u = 0
    for (let s = 0; s < PALETTE_POSITIONS.length - 1; s++) {
      const a = PALETTE_POSITIONS[s]!
      const b = PALETTE_POSITIONS[s + 1]!
      if (t <= b || s === PALETTE_POSITIONS.length - 2) {
        c0 = colors[s]!
        c1 = colors[s + 1]!
        u = (t - a) / (b - a || 1)
        break
      }
    }
    u = Math.min(1, Math.max(0, u))
    lut[i * 3] = Math.round(c0[0] + (c1[0] - c0[0]) * u)
    lut[i * 3 + 1] = Math.round(c0[1] + (c1[1] - c0[1]) * u)
    lut[i * 3 + 2] = Math.round(c0[2] + (c1[2] - c0[2]) * u)
  }
  return lut
}

export function applyLut(
  r: number,
  g: number,
  b: number,
  lut: Uint8ClampedArray | null,
  L: number,
): [number, number, number] {
  if (!lut) return [r, g, b]
  const i = Math.min(255, Math.max(0, Math.round(L * 255)))
  return [lut[i * 3]!, lut[i * 3 + 1]!, lut[i * 3 + 2]!]
}
