import weaponStatsZh from './weapon-stats-zh.json'
import equipStatsZh from './equip-stats-zh.json'

/** 武器词条 key（gat_passive_attr_* / gst_passive_*）→ 中文名 */
export const weaponStatLabels: Readonly<Record<string, string>> = weaponStatsZh

/** 装备属性 key（数字 id 或英文标识）→ 中文名 */
export const equipStatLabels: Readonly<Record<string, string>> = equipStatsZh

/** 武器属性展示；null 表示该槽位不限制，显示"任意" */
export function weaponStatLabel(value: string | null): string {
  return value === null ? '任意' : weaponStatLabels[value] ?? value
}

/** 装备属性 key 展示；未知 key 回退原始值 */
export function equipStatLabel(key: string): string {
  return equipStatLabels[key] ?? key
}

/** 副本锁定类型展示文案 */
export const LOCK_TYPE_LABELS = {
  s2: '附加属性',
  s3: '技能属性',
  none: '词条锁定',
} as const
