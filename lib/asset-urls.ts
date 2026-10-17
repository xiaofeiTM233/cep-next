/**
 * 游戏图标资源统一走 jsDelivr（Fastly）镜像上游仓库 cmyyx/cep，
 * 不随本仓库分发；@main 跟踪上游最新（jsDelivr 对分支引用的缓存约 12 小时）。
 *
 * 上游对应目录：https://github.com/cmyyx/cep/tree/main/public/images
 */

const GAME_ASSET_BASE = 'https://fastly.jsdelivr.net/gh/cmyyx/cep@main/public/images'

/** 武器图标。 */
export function weaponImageUrl(imageId: string): string {
  return `${GAME_ASSET_BASE}/weapon/${imageId}.avif`
}

/** 装备图标。 */
export function equipImageUrl(imageId: string): string {
  return `${GAME_ASSET_BASE}/equip/${imageId}.avif`
}

/** 物品 / 材料图标。 */
export function itemImageUrl(iconId: string): string {
  return `${GAME_ASSET_BASE}/items/${iconId}.avif`
}
