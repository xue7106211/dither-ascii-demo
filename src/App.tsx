import { useEffect, useState } from 'react'
import { DemoStage } from './components/DemoStage'
import './styles/app.css'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dad-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('dad-theme', theme)
  }, [theme])

  return (
    <DemoStage
      theme={theme}
      onToggleTheme={() =>
        setTheme((t) => (t === 'light' ? 'dark' : 'light'))
      }
    />
  )
}
