'use client'

import { memo } from 'react'
import { Card, Descriptions, Empty, Flex, Image as AntImage, Typography } from 'antd'
import { useRecommendations, useRefinementStore, useSelectedEquip } from '@/stores/useRefinementStore'
import { equipStatLabel } from '@/data/stat-labels'
import { resolveEquipCost } from '@/lib/equip-recipes'
import { MaterialIcon } from './material-icon'
import { CraftSwitcher } from './craft-switcher'
import { SlotRecommendationCard } from './slot-recommendation'

/**
 * 精锻推荐面板：已选装备（图标 + 属性 + 当前工艺材料）→ 工艺切换 → 三槽位推荐。
 */
export const RefinementPanel = memo(function RefinementPanel() {
  const selected = useSelectedEquip()
  const recommendations = useRecommendations()

  if (!selected) {
    return <Empty description="选择一件装备查看精锻推荐" className="py-16" />
  }

  const slots = [
    { label: '副属性1', stat: selected.sub1 },
    { label: '副属性2', stat: selected.sub2 },
    { label: '特殊属性', stat: selected.special },
  ].filter((s) => s.stat)

  return (
    <Flex vertical gap={12}>
      {/* 已选装备头部：图标 + 属性 + 当前工艺制造材料 */}
      <Card size="small">
        <Flex gap={16} wrap>
          <AntImage
            src={`/images/equip/${selected.imageId}.avif`}
            alt={selected.name}
            width={80}
            height={80}
            className="rounded-md bg-black/[0.04] dark:bg-white/[0.06]"
            style={{ objectFit: 'contain' }}
          />
          <Flex vertical gap={4} className="min-w-0 flex-1">
            <Flex align="center" gap={8} wrap>
              <Typography.Text strong>{selected.name}</Typography.Text>
              <Typography.Text type="secondary">{selected.setName}</Typography.Text>
            </Flex>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 3 }}
              items={slots.map(({ label, stat }) => ({
                key: label,
                label,
                children: (
                  <span className="whitespace-nowrap">
                    {equipStatLabel(stat!.key)}
                    <span className="font-medium text-[#d48806]">
                      +{stat!.value}
                      {stat!.unit}
                    </span>
                  </span>
                ),
              }))}
            />
            <EquipCost equipId={selected.id} />
          </Flex>
        </Flex>
      </Card>

      {/* 工艺切换：位于选中装备卡片下方、副属性1推荐上方（与装备列表共用全局状态） */}
      <CraftSwitcher />

      {/* 三槽位推荐 */}
      {recommendations.map((rec) => (
        <SlotRecommendationCard key={rec.slotKey} recommendation={rec} />
      ))}
    </Flex>
  )
})

/** 已选装备在当前全局工艺下的制造材料（图标展示）。 */
function EquipCost({ equipId }: { equipId: string }) {
  const selected = useSelectedEquip()
  const craftMaterial = useRefinementStore((s) => s.craftMaterial)
  if (!selected || selected.id !== equipId) return null

  const { materials, unsupported } = resolveEquipCost(selected, craftMaterial)

  return (
    <Flex vertical gap={4} className="mt-1">
      <Flex align="center" gap={6} wrap>
        <span className="text-xs text-black/45 dark:text-white/45">制造材料</span>
        {unsupported && (
          <Typography.Text type="warning" className="!text-xs">
            该装备不支持所选原件，已显示默认工艺
          </Typography.Text>
        )}
      </Flex>
      <Flex gap={10} wrap align="flex-start">
        {materials.map((mat) => (
          <MaterialIcon
            key={mat.name}
            name={mat.name}
            iconId={mat.iconId ?? ''}
            count={mat.count}
            size={48}
          />
        ))}
      </Flex>
    </Flex>
  )
}
