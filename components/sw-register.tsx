'use client'

import { useEffect } from 'react'
import { isGameAssetUrl } from '@/lib/asset-urls'

/**
 * 注册游戏图标本地缓存 Service Worker（public/game-assets-sw.js）：
 * 仅缓存镜像 CDN 上的游戏图标，Next.js 自身资源一律放行；
 * 不可用时（非安全上下文 / 浏览器禁用）静默降级为直连 CDN。
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onLoad = () => {
      void navigator.serviceWorker
        .register('/game-assets-sw.js')
        .then(async (registration) => {
          // 主动检查一次更新，尽快拿到新版缓存策略
          void registration.update()
          await navigator.serviceWorker.ready
          warmLoadedAssets()
        })
        .catch(() => {
          // SW 注册失败不影响站点使用，图标直连 CDN
        })
    }

    // 页面加载完成后再注册，避免与首屏图标抢带宽
    window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}

/**
 * 把文档中已加载的镜像图标交给 SW 预热——首屏图标可能早于 SW 激活就加载完了，
 * 不预热的话要等下一次打开页面才会进缓存。未拿到控制权时等 controllerchange 再试。
 */
function warmLoadedAssets(): void {
  const controller = navigator.serviceWorker.controller
  if (!controller) {
    navigator.serviceWorker.addEventListener('controllerchange', warmLoadedAssets, {
      once: true,
    })
    return
  }
  const urls = Array.from(document.images, (img) => img.currentSrc || img.src).filter(
    isGameAssetUrl,
  )
  if (urls.length > 0) {
    controller.postMessage({ type: 'warm-cache', urls })
  }
}
