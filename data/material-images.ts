/** 材料/调度券名称 → 图标 id（public/images/items/{id}.avif）。 */
export const MATERIAL_ICON_IDS: Readonly<Record<string, string>> = {
  息壤装备原件: 'item_equip_script_4',
  赤铜装备原件: 'item_equip_script_4_1',
  赫铜装备原件: 'item_equip_script_4_2',
  灼铜装备原件: 'item_equip_script_4_3',
  武陵调度券: 'item_domain_jinlong_coupon',
  谷地调度券: 'item_domain_tundra_coupon',
}

/** 材料图标路径；无图标的材料返回 undefined。 */
export function materialImageSrc(name: string): string | undefined {
  const iconId = MATERIAL_ICON_IDS[name]
  return iconId ? `/images/items/${iconId}.avif` : undefined
}
