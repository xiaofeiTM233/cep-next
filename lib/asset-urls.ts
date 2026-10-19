import { ASSET_MIRRORS } from '@/lib/asset-mirrors'
import { useMirrorStore } from '@/stores/useMirrorStore'

/**
 * 游戏图标资源统一走镜像 CDN，不随本仓库分发；
 * 镜像源可实时切换（stores/useMirrorStore + components/mirror-switch.tsx），
 * 默认 Fastly，@main 跟踪上游最新（jsDelivr 对分支引用的缓存约 12 小时）。
 *
 * 上游对应目录：https://github.com/cmyyx/cep/tree/main/public/images
 */

export const ASSET_REPO_PATH = '/gh/cmyyx/cep@main/public/images'

/** 当前镜像 base（纯函数读取，可在 React 之外调用）。 */
function currentMirrorBase(): string {
  return ASSET_MIRRORS[useMirrorStore.getState().mirror].base
}

/**
 * 订阅镜像源切换：图标 URL 在组件渲染时生成，
 * 切换镜像后必须重渲染才会拿到新地址——渲染图标的组件调用一次即可。
 */
export function useGameAssetMirror(): void {
  useMirrorStore((s) => s.mirror)
}

/** 武器图标。 */
export function weaponImageUrl(imageId: string): string {
  return `${currentMirrorBase()}${ASSET_REPO_PATH}/weapon/${imageId}.avif`
}

/** 装备图标。 */
export function equipImageUrl(imageId: string): string {
  return `${currentMirrorBase()}${ASSET_REPO_PATH}/equip/${imageId}.avif`
}

/** 物品 / 材料图标。 */
export function itemImageUrl(iconId: string): string {
  return `${currentMirrorBase()}${ASSET_REPO_PATH}/items/${iconId}.avif`
}

/**
 * 判断 URL 是否为任一镜像上的游戏图标资源。
 * 供 Service Worker 缓存预热（components/sw-register.tsx）复用镜像白名单；
 * 域名清单需与 public/game-assets-sw.js 中的 ASSET_HOSTS 保持一致。
 */
export function isGameAssetUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url)
    return (
      pathname.startsWith(ASSET_REPO_PATH) &&
      Object.values(ASSET_MIRRORS).some(
        (mirror) => new URL(mirror.base).hostname === hostname,
      )
    )
  } catch {
    return false
  }
}
