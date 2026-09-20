/** 装备制造配方（精炼自旧项目 generated wiki 数据的类型） */

export interface WikiEquipmentPlannerMaterial {
  itemId: string
  iconId: string
  rarity: number
  count: number
}

/** 一条制造配方（chainId 相同 = 同一工艺链；isDefault = 默认工艺） */
export interface WikiEquipmentPlannerRecipe {
  chainId: number
  discount: number
  isDefault: boolean
  materials: WikiEquipmentPlannerMaterial[]
}

export interface WikiEquipmentPlannerPreview {
  stats: unknown[]
  craftingRecipes: WikiEquipmentPlannerRecipe[]
}
