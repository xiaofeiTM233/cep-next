/**
 * 游戏图标本地缓存 Service Worker。
 *
 * 背景：图标资源来自 jsDelivr / jsMirror 镜像 CDN（域名与路径约定见
 * lib/asset-mirrors.ts 与 lib/asset-urls.ts，两处需保持同步），
 * 上游对分支引用（@main）返回的缓存头不可靠，浏览器每次打开页面都会重新拉取。
 *
 * 策略：cache-first + 过期后台刷新（stale-while-revalidate）
 *   - 命中且未过期（12h，与 jsDelivr 分支缓存对齐）→ 直接读本地缓存；
 *   - 命中但已过期 → 先返回旧缓存不阻塞渲染，后台静默更新；
 *   - 未命中 → 回源拉取并写入缓存（跨域图片为 opaque response，照常可缓存）；
 *   - 断网且无缓存 → 返回网络错误（与直连 CDN 失败时表现一致）。
 *
 * 只拦截镜像 CDN 上的游戏图标 GET 请求，其余请求（Next.js 自身资源等）一概放行。
 */

const CACHE_NAME = 'game-assets-v1'

/** 缓存过期时间：与 jsDelivr 对分支引用（@main）的约 12h 缓存对齐。 */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000

/** 镜像域名白名单，与 lib/asset-mirrors.ts 的 ASSET_MIRRORS 保持一致。 */
const ASSET_HOSTS = [
  'fastly.jsdelivr.net',
  'testingcf.jsdelivr.net',
  'cdn.jsdelivr.net',
  'cdn.jsdmirror.com',
  'cdn.jsdmirror.cn',
]

/** 仓库资源路径前缀，与 lib/asset-urls.ts 的 ASSET_REPO_PATH 前缀一致。 */
const ASSET_PATH_PREFIX = '/gh/cmyyx/cep@'

/** 仅拦截游戏图标：GET + 镜像域名 + 仓库资源路径。 */
function isGameAssetRequest(request) {
  if (request.method !== 'GET') return false
  let url
  try {
    url = new URL(request.url)
  } catch {
    return false
  }
  return ASSET_HOSTS.includes(url.hostname) && url.pathname.startsWith(ASSET_PATH_PREFIX)
}

/** 给缓存条目盖上写入时间供过期判断（opaque response 的头不可读，需重建 Response）。 */
function stampCacheTime(response) {
  const headers = new Headers(response.headers)
  headers.set('x-cached-at', String(Date.now()))
  return new Response(response.body, { headers })
}

/** 后台刷新缓存；失败时静默保留旧缓存，下次打开页面再试。 */
async function revalidate(cache, request) {
  try {
    const fresh = await fetch(request)
    if (fresh.type === 'opaque' || fresh.ok) {
      await cache.put(request, stampCacheTime(fresh))
    }
  } catch {
    /* 保留旧缓存 */
  }
}

async function handleAssetRequest(request, event) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    const cachedAt = Number(cached.headers.get('x-cached-at') || NaN)
    if (Number.isFinite(cachedAt) && Date.now() - cachedAt < STALE_AFTER_MS) {
      return cached
    }
    // 已过期：先返回旧缓存，后台静默刷新
    if (typeof event.waitUntil === 'function') {
      event.waitUntil(revalidate(cache, request))
    }
    return cached
  }

  try {
    const fresh = await fetch(request)
    if (fresh.type === 'opaque' || fresh.ok) {
      const stamped = stampCacheTime(fresh)
      await cache.put(request, stamped)
      return stamped
    }
    return fresh
  } catch {
    return Response.error()
  }
}

self.addEventListener('install', () => {
  // 新 SW 立即接管，不必等旧 SW 控制下的页面全部关闭
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 清理旧版本缓存（CACHE_NAME 升级时）
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith('game-assets-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  if (!isGameAssetRequest(event.request)) return
  event.respondWith(handleAssetRequest(event.request, event))
})

/** 页面预热：SW 激活前就已加载完成的图标，补写进缓存（幂等，已缓存会跳过）。 */
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'warm-cache' || !Array.isArray(data.urls)) return
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await Promise.all(
        data.urls.map(async (url) => {
          try {
            if (await cache.match(url)) return
            const request = new Request(url, { mode: 'no-cors' })
            const fresh = await fetch(request)
            if (fresh.type === 'opaque' || fresh.ok) {
              await cache.put(request, stampCacheTime(fresh))
            }
          } catch {
            /* 单个图标预热失败不影响其他 */
          }
        }),
      )
    })(),
  )
})
