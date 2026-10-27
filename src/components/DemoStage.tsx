import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react'
import { EffectLayer } from './EffectLayer'
import { EffectPanel } from './EffectPanel'
import {
  defaultSettings,
  type Settings,
} from '../effects/types'
const sampleImg = "/samples/sample.jpg"
const sampleVid = "/samples/sample.mp4"

type MediaSource =
  | { kind: 'image'; url: string; label: string }
  | { kind: 'video'; url: string; label: string }

const BUNDLED: MediaSource[] = [
  { kind: 'image', url: sampleImg, label: 'Sample image' },
  { kind: 'video', url: sampleVid, label: 'Sample video' },
]

export function DemoStage({
  theme,
  onToggleTheme,
}: {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  const [settings, setSettings] = useState<Settings>(() => defaultSettings())
  const [source, setSource] = useState<MediaSource>(BUNDLED[0]!)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [box, setBox] = useState({ w: 420, h: 560 })
  const [revision, setRevision] = useState(0)
  const [ready, setReady] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const activeUrl = objectUrl ?? source.url

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      setBox({ w: Math.round(cr.width), h: Math.round(cr.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const bindMedia = useCallback(
    (node: HTMLImageElement | HTMLVideoElement | null) => {
      mediaRef.current = node
    },
    [],
  )

  const onLoaded = () => {
    setReady(true)
    setRevision((r) => r + 1)
  }

  const pickBundled = (m: MediaSource) => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }
    setReady(false)
    setSource(m)
  }

  const onUpload = (file: File | null) => {
    if (!file) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setReady(false)
    const kind = file.type.startsWith('video') ? 'video' : 'image'
    setSource({ kind, url, label: file.name })
  }

  return (
    <div className="demo">
      <header className="topbar">
        <div className="brand">
          <span className="mark">∎</span>
          <div>
            <h1>Dither &amp; ASCII</h1>
            <p>
              Parametric overlay · inspired by{' '}
              <a
                href="https://x.com/Kubai087/status/2115091203465290087"
                target="_blank"
                rel="noreferrer"
              >
                @Kubai087
              </a>
            </p>
          </div>
        </div>
        <div className="top-actions">
          <div className="seg">
            {BUNDLED.map((m) => (
              <button
                key={m.label}
                type="button"
                className={
                  !objectUrl && source.url === m.url ? 'active' : ''
                }
                onClick={() => pickBundled(m)}
              >
                {m.kind === 'image' ? 'Image' : 'Video'}
              </button>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()}>
              Upload
            </button>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '☾ Dark' : '☀ Light'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
        </div>
      </header>

      <div className="layout">
        <div className="stage-wrap">
          <div className="login-card">
            <div className="card-glow" />
            <div className="stage" ref={stageRef}>
              {source.kind === 'image' ? (
                <img
                  key={activeUrl}
                  ref={bindMedia as RefCallback<HTMLImageElement>}
                  src={activeUrl}
                  alt=""
                  className="asset"
                  onLoad={onLoaded}
                  draggable={false}
                />
              ) : (
                <video
                  key={activeUrl}
                  ref={bindMedia as RefCallback<HTMLVideoElement>}
                  src={activeUrl}
                  className="asset"
                  muted
                  loop
                  playsInline
                  autoPlay
                  onLoadedData={onLoaded}
                />
              )}
              {ready && (
                <EffectLayer
                  mediaRef={mediaRef}
                  mediaKind={source.kind}
                  settings={
                    settings.filter === 'ascii'
                      ? settings.ascii
                      : settings.dither
                  }
                  filter={settings.filter}
                  theme={theme}
                  boxW={box.w}
                  boxH={box.h}
                  revision={revision}
                />
              )}
            </div>
            <div className="card-chrome">
              <p className="card-kicker">Welcome back</p>
              <h3>Sign in to Studio</h3>
              <div className="fake-fields">
                <div className="fake-input">you@studio.dev</div>
                <div className="fake-input">••••••••</div>
                <button type="button" className="fake-cta">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>

        <EffectPanel
          settings={settings}
          onChange={setSettings}
          theme={theme}
          assetUrl={activeUrl}
        />
      </div>
    </div>
  )
}
