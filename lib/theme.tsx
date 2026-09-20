'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'cep-theme'

function subscribe(callback: () => void): () => void {
  // storage 事件覆盖跨标签页同步；toggle 内手动 dispatch 覆盖本标签页
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot(): ThemeMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function getServerSnapshot(): ThemeMode {
  return 'light'
}

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => {},
})

/**
 * 亮/暗主题状态。SSR 快照固定 light（根布局内联脚本提前设置 data-theme，
 * hydrate 前由 CSS 变量兜底背景色，避免闪白）。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const next = getSnapshot() === 'light' ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage 不可用时主题仅对当前视图生效
    }
    document.documentElement.dataset.theme = next
    window.dispatchEvent(new Event('storage'))
  }, [])

  const value = useMemo(() => ({ mode, toggle }), [mode, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
