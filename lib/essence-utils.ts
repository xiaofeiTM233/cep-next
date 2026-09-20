import type { Weapon } from '@/types/matrix'
import { dungeons } from '@/data/dungeons'

/** 稀有度 → 主题色（游戏惯例：金/紫/蓝/绿）。 */
export const RARITY_COLORS: Record<Weapon['rarity'], string> = {
  6: '#f5a623',
  5: '#b37feb',
  4: '#5b8ff9',
  3: '#5ad8a6',
}

/** 武器图标路径；自定义/预览武器无图返回 undefined。 */
export function weaponImageSrc(id: string, iconId?: string): string | undefined {
  if (id.startsWith('custom-') || id.startsWith('preview:') || id.startsWith('data:')) {
    return undefined
  }
  const imageId = iconId ?? id
  return `/images/weapon/${imageId}.avif`
}

/** 武器三属性候选值：由副本池静态派生。 */
export const PRIMARY_STAT_OPTIONS = [...new Set(dungeons.flatMap((d) => d.s1Pool))]
export const ELEMENTAL_STAT_OPTIONS = [...new Set(dungeons.flatMap((d) => d.s2Pool))]
export const SPECIAL_STAT_OPTIONS = [...new Set(dungeons.flatMap((d) => d.s3Pool))]

/** 方案侧武器可见性（受设置开关控制）。 */
export interface PlanVisibilityFlags {
  hideFourStarPlans: boolean
  hideThreeStarPlans: boolean
  hideUnownedPlans: boolean
  hideEssenceOwnedPlans: boolean
  onlyBothOwnedPlans: boolean
  weaponOwnership: Record<string, boolean>
  essenceStatus: Record<string, boolean>
}

export function isWeaponVisibleInPlans(
  weapon: Weapon,
  flags: PlanVisibilityFlags,
): boolean {
  const {
    hideFourStarPlans,
    hideThreeStarPlans,
    hideUnownedPlans,
    hideEssenceOwnedPlans,
    onlyBothOwnedPlans,
    weaponOwnership,
    essenceStatus,
  } = flags
  if ((hideFourStarPlans && weapon.rarity === 4) || (hideThreeStarPlans && weapon.rarity === 3)) {
    return false
  }
  if (hideUnownedPlans && weaponOwnership[weapon.id] !== true) return false
  if (hideEssenceOwnedPlans) {
    const essenceOwned = essenceStatus[weapon.id] === true
    const weaponOwned = weaponOwnership[weapon.id] === true
    if (onlyBothOwnedPlans) {
      if (essenceOwned && weaponOwned) return false
    } else if (essenceOwned) {
      return false
    }
  }
  return true
}
