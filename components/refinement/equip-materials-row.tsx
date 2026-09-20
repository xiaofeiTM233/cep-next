'use client'

import { Flex } from 'antd'
import type { Equip } from '@/types/refinement'
import { resolveEquipCost } from '@/lib/equip-recipes'
import { useRefinementStore } from '@/stores/useRefinementStore'
import { MaterialIcon } from './material-icon'

interface EquipMaterialsRowProps {
  equip: Equip
  /** 图标尺寸 */
  size?: number
}

/**
 * 装备在当前全局工艺（原件）下的制造材料行。
 * 所选原件该装备不支持时回退默认工艺。
 */
export function EquipMaterialsRow({ equip, size = 28 }: EquipMaterialsRowProps) {
  const craftMaterial = useRefinementStore((s) => s.craftMaterial)
  const { materials } = resolveEquipCost(equip, craftMaterial)

  return (
    <Flex align="flex-end" gap={6} className="min-w-0 overflow-hidden whitespace-nowrap">
      {materials.map((mat) => (
        <MaterialIcon
          key={mat.name}
          name={mat.name}
          iconId={mat.iconId ?? ''}
          count={mat.count}
          size={size}
        />
      ))}
    </Flex>
  )
}
