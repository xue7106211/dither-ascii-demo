import type { CSSProperties, ReactNode } from 'react'
import type {
  FilterKind,
  FilterSettings,
  InkTone,
  PaletteId,
  Settings,
} from '../effects/types'
import { PALETTE_STOPS, RECOMMENDED } from '../effects/types'

type Props = {
  settings: Settings
  onChange: (next: Settings) => void
  theme: 'light' | 'dark'
  assetUrl: string
}

const PALETTES: { id: PaletteId; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'meadow', label: 'Meadow' },
  { id: 'blue', label: 'Blue' },
  { id: 'amber', label: 'Amber' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'mono', label: 'Mono' },
]

function patchActive(
  s: Settings,
  patch: Partial<FilterSettings>,
): Settings {
  const key = s.filter === 'ascii' ? 'ascii' : 'dither'
  return { ...s, [key]: { ...s[key], ...patch } }
}

export function EffectPanel({ settings, onChange, theme, assetUrl }: Props) {
  const active = settings.filter === 'ascii' ? settings.ascii : settings.dither
  const isAscii = settings.filter === 'ascii'

  return (
    <aside className="effect-panel" data-theme={theme}>
      <header className="panel-head">
        <div>
          <p className="eyebrow">Effect</p>
          <h2>Dither · ASCII</h2>
        </div>
        <button
          type="button"
          className="reset-btn"
          onClick={() =>
            onChange({
              ...settings,
              [settings.filter]: { ...RECOMMENDED[settings.filter] },
            })
          }
        >
          Reset to recommended
        </button>
      </header>

      <Row label="Mask effect">
        <Slider
          value={active.mask}
          onChange={(mask) => onChange(patchActive(settings, { mask }))}
        />
      </Row>

      <Row label="Filter">
        <div className="tabs" role="tablist">
          {(['ascii', 'dither'] as FilterKind[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={settings.filter === f}
              className={settings.filter === f ? 'tab active' : 'tab'}
              onClick={() => onChange({ ...settings, filter: f })}
            >
              {f === 'ascii' ? 'ASCII' : 'Dither'}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Color">
        <div className="swatches">
          {PALETTES.map((p) => {
            const selected = active.palette === p.id
            let bg: string
            if (p.id === 'original') {
              bg = `url(${assetUrl}) center/cover`
            } else {
              const stops = PALETTE_STOPS[p.id]
              bg = `linear-gradient(135deg, ${stops[1]}, ${stops[2]})`
            }
            return (
              <button
                key={p.id}
                type="button"
                title={p.label}
                aria-label={p.label}
                aria-pressed={selected}
                className={selected ? 'swatch selected' : 'swatch'}
                style={{ background: bg }}
                onClick={() =>
                  onChange(patchActive(settings, { palette: p.id }))
                }
              />
            )
          })}
        </div>
      </Row>

      {isAscii && (
        <Row label="Sample tones">
          <div className="tabs compact">
            {(['shadows', 'highlights'] as InkTone[]).map((t) => (
              <button
                key={t}
                type="button"
                className={active.inkTone === t ? 'tab active' : 'tab'}
                onClick={() =>
                  onChange(patchActive(settings, { inkTone: t }))
                }
              >
                {t === 'shadows' ? 'Shadows' : 'Highlights'}
              </button>
            ))}
          </div>
        </Row>
      )}

      <Row label="Sampling strength">
        <Slider
          value={active.strength}
          onChange={(strength) =>
            onChange(patchActive(settings, { strength }))
          }
        />
      </Row>

      <Row label="Size">
        <Slider
          value={active.size}
          onChange={(size) => onChange(patchActive(settings, { size }))}
        />
      </Row>

      <Row label="Spacing">
        <Slider
          value={active.spacing}
          onChange={(spacing) =>
            onChange(patchActive(settings, { spacing }))
          }
          suffix="%"
        />
      </Row>
    </aside>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="panel-row">
      <div className="row-label">{label}</div>
      <div className="row-control">{children}</div>
    </div>
  )
}

function Slider({
  value,
  onChange,
  suffix = '',
}: {
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="slider-wrap">
      <div className="slider-track-wrap">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider"
          style={
            {
              '--pct': `${value}%`,
            } as CSSProperties
          }
        />
        <span className="snap-mark" aria-hidden />
      </div>
      <output className="slider-value">
        {Math.round(value)}
        {suffix}
      </output>
    </div>
  )
}
