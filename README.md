# Dither & ASCII Demo

Parametric **Dither** and **ASCII** canvas overlay for login cards / hero media — mask, palette, sampling strength, size, spacing.

灵感来自枯白啃设计 [@Kubai087](https://x.com/Kubai087) 的帖子：[新栏目《999 个小技巧》003 Dither 与 ASCII](https://x.com/Kubai087/status/2115091203465290087)。本仓库为独立 Demo 实现，非官方仓库。

Inspired by [@Kubai087](https://x.com/Kubai087)’s tip [#2115091203465290087](https://x.com/Kubai087/status/2115091203465290087). Standalone demo implementation (unofficial).

## Features · 功能

- Reusable `EffectLayer` (canvas overlay) + `EffectPanel`
- ASCII / Bayer 4×4 dither filters with separate recommended defaults
- Palettes: Original, Meadow, Blue, Amber, Lavender, Mono (luminance LUT)
- Mask gradient, light/dark theme, image / sample video / user upload
- Video frames via `requestVideoFrameCallback`

## Run · 本地运行

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Stack

Vite · React · TypeScript · Cloudflare Pages

## License

MIT
