import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ASSET_MIRRORS,
  DEFAULT_ASSET_MIRROR,
  type AssetMirrorKey,
} from '@/lib/asset-mirrors'

/**
 * 图标镜像源选择：持久化到 localStorage（key: cep-mirror）。
 * URL 在组件渲染时读取当前值（lib/asset-urls.ts），切换后即时生效。
 */

export interface MirrorState {
  mirror: AssetMirrorKey
  setMirror: (mirror: AssetMirrorKey) => void
}

export const useMirrorStore = create<MirrorState>()(
  persist(
    (set) => ({
      mirror: DEFAULT_ASSET_MIRROR,
      setMirror: (mirror) => set({ mirror }),
    }),
    {
      name: 'cep-mirror',
      partialize: (s) => ({ mirror: s.mirror }),
      merge: (persisted, current) => {
        const key = (persisted as { mirror?: unknown } | null)?.mirror
        return {
          ...current,
          mirror:
            typeof key === 'string' && key in ASSET_MIRRORS
              ? (key as AssetMirrorKey)
              : current.mirror,
        }
      },
    },
  ),
)
