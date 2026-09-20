'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Splitter 面板尺寸持久化：按 key 记录左侧面板宽度（%）到 localStorage。
 *
 * antd Splitter 的数字 size / 回调 sizes 单位都是 px，百分比要用字符串；
 * 为避免 SSR 水合不匹配，首帧用 fallback 渲染，挂载后再应用存储值（受控模式）。
 */
export function useSplitterSize(storageKey: string, fallbackPercent: number): {
  size: string
  onResize: (sizes: number[]) => void
  onResizeEnd: (sizes: number[]) => void
} {
  const [percent, setPercent] = useState<number | null>(null)

  // 挂载后从 localStorage 应用存储值（SSR 无法读取，只能在 effect 里同步外部系统）
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`cep-splitter-${storageKey}`)
      const value = raw != null ? Number(raw) : NaN
      // 合法范围 10-90（%），防止脏数据把面板挤没
      if (Number.isFinite(value) && value >= 10 && value <= 90) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 挂载后读取外部存储的一次性同步
        setPercent(value)
      }
    } catch {
      /* localStorage 不可用时保持默认 */
    }
  }, [storageKey])

  const update = useCallback((sizes: number[]) => {
    // 回调单位是 px，换算为百分比；折叠时 sizes 接近 0，如实反映（否则受控值会把面板弹回）
    const first = sizes[0]
    if (!Number.isFinite(first) || first < 0) return
    const next = Math.min((first / window.innerWidth) * 100, 100)
    setPercent(Math.round(next * 10) / 10)
  }, [])

  const onResize = update

  const onResizeEnd = useCallback(
    (sizes: number[]) => {
      update(sizes)
      // 拖拽结束时写入 localStorage
      const first = sizes[0]
      if (!Number.isFinite(first) || first <= 0) return
      const next = (first / window.innerWidth) * 100
      if (next < 10 || next > 90) return
      try {
        window.localStorage.setItem(
          `cep-splitter-${storageKey}`,
          String(Math.round(next * 10) / 10),
        )
      } catch {
        /* ignore */
      }
    },
    [storageKey, update],
  )

  return { size: `${percent ?? fallbackPercent}%`, onResize, onResizeEnd }
}
