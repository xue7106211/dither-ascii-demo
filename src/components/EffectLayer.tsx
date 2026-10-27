import { useEffect, useRef, type RefObject } from 'react'
import type { FilterKind, FilterSettings } from '../effects/types'
import { renderEffect } from '../effects/render'

type Props = {
  mediaRef: RefObject<HTMLImageElement | HTMLVideoElement | null>
  mediaKind: 'image' | 'video'
  settings: FilterSettings
  filter: FilterKind
  theme: 'light' | 'dark'
  boxW: number
  boxH: number
  /** Bump to force redraw (settings / media change). */
  revision: number
}

const CROSSFADE_MS = 150
const DEBOUNCE_MS = 72
const DPR_CAP = 1.6

export function EffectLayer({
  mediaRef,
  mediaKind,
  settings,
  filter,
  theme,
  boxW,
  boxH,
  revision,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prevCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fadeRef = useRef<{ start: number; fromFilter: FilterKind; fromPalette: string } | null>(null)
  const lastKeyRef = useRef('')
  const rafRef = useRef(0)
  const debounceRef = useRef(0)
  const playingRafRef = useRef(0)

  useEffect(() => {
    const key = `${filter}|${settings.palette}`
    if (lastKeyRef.current && lastKeyRef.current !== key && canvasRef.current) {
      const snap = document.createElement('canvas')
      snap.width = canvasRef.current.width
      snap.height = canvasRef.current.height
      const sctx = snap.getContext('2d')!
      sctx.drawImage(canvasRef.current, 0, 0)
      prevCanvasRef.current = snap
      fadeRef.current = {
        start: performance.now(),
        fromFilter: filter,
        fromPalette: settings.palette,
      }
    }
    lastKeyRef.current = key
  }, [filter, settings.palette])

  useEffect(() => {
    const canvas = canvasRef.current
    const media = mediaRef.current
    if (!canvas || !media || boxW < 1 || boxH < 1) return

    const dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1)

    const drawOnce = (fadeT = 1) => {
      const src =
        mediaKind === 'video'
          ? (media as HTMLVideoElement)
          : (media as HTMLImageElement)
      const srcW =
        mediaKind === 'video'
          ? (src as HTMLVideoElement).videoWidth || boxW
          : (src as HTMLImageElement).naturalWidth || boxW
      const srcH =
        mediaKind === 'video'
          ? (src as HTMLVideoElement).videoHeight || boxH
          : (src as HTMLImageElement).naturalHeight || boxH
      if (srcW < 1 || srcH < 1) return

      renderEffect(canvas, {
        source: src,
        srcW,
        srcH,
        boxW,
        boxH,
        dpr,
        filter,
        settings,
        theme,
        previous: fadeT < 1 ? prevCanvasRef.current : null,
        fadeT,
      })
    }

    const tickFade = () => {
      const fade = fadeRef.current
      if (!fade) {
        drawOnce(1)
        return
      }
      const t = Math.min(1, (performance.now() - fade.start) / CROSSFADE_MS)
      drawOnce(t)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tickFade)
      } else {
        fadeRef.current = null
        prevCanvasRef.current = null
      }
    }

    const schedule = () => {
      window.clearTimeout(debounceRef.current)
      if (mediaKind === 'video') {
        tickFade()
        return
      }
      debounceRef.current = window.setTimeout(() => tickFade(), DEBOUNCE_MS)
    }

    schedule()

    // Video: redraw each frame while playing & on screen
    let vfcHandle = 0
    const video = mediaKind === 'video' ? (media as HTMLVideoElement) : null

    const onFrame = () => {
      if (!video) return
      tickFade()
      if ('requestVideoFrameCallback' in video) {
        vfcHandle = (video as HTMLVideoElement & {
          requestVideoFrameCallback: (cb: () => void) => number
        }).requestVideoFrameCallback(onFrame)
      } else {
        playingRafRef.current = requestAnimationFrame(onFrame)
      }
    }

    const startVideoLoop = () => {
      stopVideoLoop()
      if (!video || video.paused || video.ended) return
      onFrame()
    }
    const stopVideoLoop = () => {
      if (video && 'cancelVideoFrameCallback' in video && vfcHandle) {
        ;(video as HTMLVideoElement & {
          cancelVideoFrameCallback: (h: number) => void
        }).cancelVideoFrameCallback(vfcHandle)
      }
      cancelAnimationFrame(playingRafRef.current)
      vfcHandle = 0
    }

    if (video) {
      video.addEventListener('play', startVideoLoop)
      video.addEventListener('pause', stopVideoLoop)
      video.addEventListener('seeked', () => tickFade())
      if (!video.paused) startVideoLoop()
    }

    return () => {
      window.clearTimeout(debounceRef.current)
      cancelAnimationFrame(rafRef.current)
      stopVideoLoop()
      if (video) {
        video.removeEventListener('play', startVideoLoop)
        video.removeEventListener('pause', stopVideoLoop)
      }
    }
  }, [
    mediaRef,
    mediaKind,
    settings,
    filter,
    theme,
    boxW,
    boxH,
    revision,
  ])

  return (
    <canvas
      ref={canvasRef}
      className="effect-layer"
      aria-hidden
      style={{ width: boxW, height: boxH }}
    />
  )
}
