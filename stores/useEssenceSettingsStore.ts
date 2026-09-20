import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Weapon } from '@/types/matrix'
import { sanitizeBooleanRecord } from '@/lib/persist-sanitizer'

/**
 * 基质规划设置：地区优先级、方案隐藏开关、自定义武器、武器/基质拥有标记。
 * 持久化字段名沿用旧项目（essence-settings），老用户 localStorage 无缝迁移。
 */

export const WEAPON_TYPES = ['单手剑', '双手剑', '长柄武器', '手铳', '施术单元'] as const

export interface CustomWeapon extends Weapon {
  source?: never
}

/** 自定义武器 id 前缀；武器 id 是否有效 = 内置 或 活跃自定义。 */
export const CUSTOM_WEAPON_PREFIX = 'custom-'

interface EssenceSettingsState {
  // 方案侧隐藏开关（沿用旧持久化字段名）
  hideFourStarWeaponsPlans: boolean
  hideThreeStarWeaponsPlans: boolean
  hideUnownedWeaponsPlans: boolean
  hideEssenceOwnedWeaponsPlans: boolean
  onlyHideWhenBothOwnedPlans: boolean

  // 地区优先级（存原始中文地区名）
  regionFirst: string | null
  regionSecond: string | null

  // 自定义武器
  customWeapons: CustomWeapon[]

  // 拥有标记
  weaponOwnership: Record<string, boolean>
  essenceStatus: Record<string, boolean>

  // 武器卡片尺寸（拖拽分栏不改变卡片大小，仅改变列数）
  cardSize: CardSize

  setFlag: (key: SettingFlagKey, value: boolean) => void
  setRegionFirst: (region: string | null) => void
  setRegionSecond: (region: string | null) => void
  setCardSize: (size: CardSize) => void
  addCustomWeapon: (weapon: CustomWeapon) => void
  updateCustomWeapon: (weapon: CustomWeapon) => void
  removeCustomWeapon: (id: string) => void
  setWeaponOwnership: (id: string, owned: boolean) => void
  setEssenceStatus: (id: string, owned: boolean) => void
}

export type SettingFlagKey =
  | 'hideFourStarWeaponsPlans'
  | 'hideThreeStarWeaponsPlans'
  | 'hideUnownedWeaponsPlans'
  | 'hideEssenceOwnedWeaponsPlans'
  | 'onlyHideWhenBothOwnedPlans'

/** 武器卡片尺寸档位 */
export type CardSize = 'large' | 'middle' | 'small'

/** 各档位对应的卡片列宽（px），拖拽分栏只改变列数 */
export const CARD_SIZE_PX: Record<CardSize, number> = {
  large: 176,
  middle: 144,
  small: 116,
}

const DEFAULTS: Record<SettingFlagKey, boolean> = {
  hideFourStarWeaponsPlans: true,
  hideThreeStarWeaponsPlans: true,
  hideUnownedWeaponsPlans: false,
  hideEssenceOwnedWeaponsPlans: false,
  onlyHideWhenBothOwnedPlans: false,
}

export const useEssenceSettingsStore = create<EssenceSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      regionFirst: null,
      regionSecond: null,
      customWeapons: [],
      weaponOwnership: {},
      essenceStatus: {},
      cardSize: 'middle',

      setFlag: (key, value) => set({ [key]: value } as Partial<EssenceSettingsState>),
      setRegionFirst: (region) => set({ regionFirst: region }),
      setRegionSecond: (region) => set({ regionSecond: region }),
      setCardSize: (size) => set({ cardSize: size }),

      addCustomWeapon: (weapon) =>
        set((s) => ({ customWeapons: [...s.customWeapons, weapon] })),
      updateCustomWeapon: (weapon) =>
        set((s) => ({
          customWeapons: s.customWeapons.map((w) => (w.id === weapon.id ? weapon : w)),
        })),
      removeCustomWeapon: (id) =>
        set((s) => ({ customWeapons: s.customWeapons.filter((w) => w.id !== id) })),

      setWeaponOwnership: (id, owned) =>
        set((s) => ({ weaponOwnership: { ...s.weaponOwnership, [id]: owned } })),
      setEssenceStatus: (id, owned) =>
        set((s) => ({ essenceStatus: { ...s.essenceStatus, [id]: owned } })),
    }),
    {
      name: 'essence-settings',
      partialize: (s) => ({
        hideFourStarWeaponsPlans: s.hideFourStarWeaponsPlans,
        hideThreeStarWeaponsPlans: s.hideThreeStarWeaponsPlans,
        hideUnownedWeaponsPlans: s.hideUnownedWeaponsPlans,
        hideEssenceOwnedWeaponsPlans: s.hideEssenceOwnedWeaponsPlans,
        onlyHideWhenBothOwnedPlans: s.onlyHideWhenBothOwnedPlans,
        regionFirst: s.regionFirst,
        regionSecond: s.regionSecond,
        customWeapons: s.customWeapons,
        weaponOwnership: s.weaponOwnership,
        essenceStatus: s.essenceStatus,
        cardSize: s.cardSize,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        const result = { ...current }
        // 布尔开关：只接受合法字段名上的布尔值
        for (const key of Object.keys(DEFAULTS) as SettingFlagKey[]) {
          if (typeof p[key] === 'boolean') {
            ;(result as Record<string, unknown>)[key] = p[key]
          }
        }
        // 地区优先级
        if (typeof p.regionFirst === 'string') result.regionFirst = p.regionFirst
        if (typeof p.regionSecond === 'string') result.regionSecond = p.regionSecond
        // 卡片尺寸档位
        if (p.cardSize === 'large' || p.cardSize === 'middle' || p.cardSize === 'small') {
          result.cardSize = p.cardSize
        }
        // 自定义武器：基础结构校验
        if (Array.isArray(p.customWeapons)) {
          result.customWeapons = p.customWeapons.filter(
            (w): w is CustomWeapon =>
              !!w &&
              typeof w === 'object' &&
              typeof (w as Weapon).id === 'string' &&
              (w as Weapon).id.startsWith(CUSTOM_WEAPON_PREFIX) &&
              typeof (w as Weapon).name === 'string' &&
              [3, 4, 5, 6].includes((w as Weapon).rarity),
          )
        }
        result.weaponOwnership = sanitizeBooleanRecord(p.weaponOwnership)
        result.essenceStatus = sanitizeBooleanRecord(p.essenceStatus)
        return result
      },
    },
  ),
)
