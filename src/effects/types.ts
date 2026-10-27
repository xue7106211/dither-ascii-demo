export type FilterKind = 'ascii' | 'dither'
export type InkTone = 'shadows' | 'highlights'
export type PaletteId =
  | 'original'
  | 'meadow'
  | 'blue'
  | 'amber'
  | 'lavender'
  | 'mono'

export type FilterSettings = {
  mask: number
  palette: PaletteId
  inkTone: InkTone
  strength: number
  size: number
  spacing: number
}

export type Settings = {
  filter: FilterKind
  ascii: FilterSettings
  dither: FilterSettings
}

export const ASCII_CHARS = '  .,:;-=+xX08S#&@' // two leading spaces, 17 chars

export const PALETTE_STOPS: Record<
  Exclude<PaletteId, 'original'>,
  [string, string, string, string]
> = {
  meadow: ['#2B361F', '#677D45', '#AEBA78', '#E5E1BD'],
  blue: ['#192A4D', '#326AC5', '#A2C2F1', '#EDF3FC'],
  amber: ['#3C200F', '#A74C15', '#EF9A46', '#F7E7CA'],
  lavender: ['#292144', '#6552AB', '#B3A5E4', '#F0ECFB'],
  mono: ['#151515', '#575757', '#A6A6A6', '#ECECEC'],
}

export const PALETTE_POSITIONS = [0, 0.4, 0.74, 1] as const

export const RECOMMENDED: Record<FilterKind, FilterSettings> = {
  ascii: {
    mask: 90,
    palette: 'original',
    inkTone: 'shadows',
    strength: 100,
    size: 37,
    spacing: 0,
  },
  dither: {
    mask: 88,
    palette: 'original',
    inkTone: 'shadows',
    strength: 100,
    size: 15,
    spacing: 0,
  },
}

export function defaultSettings(): Settings {
  return {
    filter: 'ascii',
    ascii: { ...RECOMMENDED.ascii },
    dither: { ...RECOMMENDED.dither },
  }
}

export function activeFilterSettings(s: Settings): FilterSettings {
  return s.filter === 'ascii' ? s.ascii : s.dither
}
