import { wikiEquipmentPlannerPreviews } from '@/data/equip-planner-previews.generated'
import type { WikiEquipmentPlannerRecipe } from '@/types/wiki-preview'
import { MATERIAL_ICON_IDS } from '@/data/material-images'
import type { Equip } from '@/types/refinement'

/** 按工艺链分组后的一条配方 */
export interface EquipRecipeChain {
  chainId: number
  isDefault: boolean
  discount: number
  materials: WikiEquipmentPlannerRecipe['materials']
  /** 该链使用的装备原件中文名（由图标 id 反查）；无则为 null */
  materialName: string | null
}

export interface EquipRecipeChains {
  /** 默认工艺（isDefault = true 的链） */
  default: EquipRecipeChain
  /** 兼容工艺（其余链） */
  alternatives: EquipRecipeChain[]
}

const ICON_TO_NAME: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(MATERIAL_ICON_IDS).map(([name, id]) => [id, name]),
)

/** 每件装备的配方链解析结果缓存（数据静态，只需解析一次） */
const chainsCache = new Map<string, EquipRecipeChains | null>()

/**
 * 取装备的制造配方链：默认工艺 + 兼容工艺。
 * 无配方数据的装备返回 null（调用方回退到 equips.ts 的文字材料）。
 */
export function getEquipCraftChains(equipId: string): EquipRecipeChains | null {
  const cached = chainsCache.get(equipId)
  if (cached !== undefined) return cached

  const preview = wikiEquipmentPlannerPreviews[equipId]
  if (!preview?.craftingRecipes?.length) {
    chainsCache.set(equipId, null)
    return null
  }

  const byChain = new Map<number, WikiEquipmentPlannerRecipe[]>()
  for (const recipe of preview.craftingRecipes) {
    const list = byChain.get(recipe.chainId) ?? []
    list.push(recipe)
    byChain.set(recipe.chainId, list)
  }

  let defaultChain: EquipRecipeChain | null = null
  const alternatives: EquipRecipeChain[] = []
  for (const [chainId, recipes] of byChain) {
    const first = recipes[0]
    const scriptMat = first.materials.find((m) => !m.itemId.includes('coupon'))
    const chain: EquipRecipeChain = {
      chainId,
      isDefault: first.isDefault,
      discount: first.discount,
      materials: first.materials,
      materialName: scriptMat ? ICON_TO_NAME[scriptMat.iconId] ?? null : null,
    }
    if (first.isDefault && !defaultChain) {
      defaultChain = chain
    } else {
      alternatives.push(chain)
    }
  }

  if (!defaultChain) {
    chainsCache.set(equipId, null)
    return null
  }
  const result = { default: defaultChain, alternatives }
  chainsCache.set(equipId, result)
  return result
}

/** 展示用的一条材料 */
export interface CostMaterial {
  name: string
  iconId?: string
  count?: number
}

export interface EquipCostResolution {
  materials: CostMaterial[]
  /** 所选工艺该装备不支持，已回退默认工艺 */
  unsupported: boolean
}

const MATERIAL_NAME_KEYS = Object.keys(MATERIAL_ICON_IDS)

/**
 * 解析一件装备在指定工艺（原件）下的制造材料。
 * @param craftMaterial 选中的原件中文名（null = 各装备默认工艺）
 * - 有配方数据的装备：按原件匹配工艺链
 * - 无配方数据的装备：用 equips.ts 的 material/altMaterial + voucher/altVoucher 文字构造
 */
export function resolveEquipCost(
  equip: Equip,
  craftMaterial: string | null,
): EquipCostResolution {
  const chains = getEquipCraftChains(equip.id)

  if (chains) {
    const target = craftMaterial
      ? [chains.default, ...chains.alternatives].find((c) => c.materialName === craftMaterial)
      : chains.default
    if (!target) {
      return { materials: toCostMaterials(chains.default.materials), unsupported: true }
    }
    return { materials: toCostMaterials(target.materials), unsupported: false }
  }

  // 无配方：legacy 文字数据
  const hasAltMaterial = !!equip.altMaterial && equip.altMaterial !== equip.material
  const useAlt =
    !!craftMaterial && hasAltMaterial && MATERIAL_NAME_KEYS.includes(craftMaterial)
      ? equip.altMaterial === craftMaterial
      : false

  const materials: CostMaterial[] = []
  const materialName = useAlt ? equip.altMaterial! : equip.material
  const iconId = MATERIAL_ICON_IDS[materialName]
  materials.push({ name: materialName, iconId, count: undefined })

  const voucher = useAlt ? equip.altVoucher : equip.voucher
  if (voucher) {
    materials.push({
      name: voucher.name,
      iconId: MATERIAL_ICON_IDS[voucher.name],
      count: voucher.count,
    })
  }

  const unsupported = !!craftMaterial && !useAlt && craftMaterial !== equip.material
  return { materials, unsupported }
}

function toCostMaterials(materials: WikiEquipmentPlannerRecipe['materials']): CostMaterial[] {
  return materials.map((m) => ({
    name: ICON_TO_NAME[m.iconId] ?? m.itemId,
    iconId: m.iconId,
    count: m.count,
  }))
}
