'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Card, Flex, Tag, Tooltip, Typography } from 'antd'
import type { Equip, ParsedStat } from '@/types/refinement'
import { equipById } from '@/data/equips'
import { equipStatLabel } from '@/data/stat-labels'
import { useRefinementStore } from '@/stores/useRefinementStore'
import { EquipMaterialsRow } from './equip-materials-row'

interface EquipCardProps {
  equip: Equip
  /** 推荐候选的匹配信息（来自哪个槽位、属性值） */
  matched?: { slotLabel: string; attr: ParsedStat }
}

const TYPE_COLORS: Record<Equip['type'], string> = {
  配件: 'blue',
  护手: 'green',
  护甲: 'orange',
}

const SLOTS: { label: string; pick: (e: Equip) => ParsedStat | null }[] = [
  { label: '副属性1', pick: (e) => e.sub1 },
  { label: '副属性2', pick: (e) => e.sub2 },
  { label: '特殊属性', pick: (e) => e.special },
]

function fmt(stat: ParsedStat): string {
  return `${equipStatLabel(stat.key)} +${stat.value}${stat.unit}`
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 属性 tooltip：自身三槽位属性；若存在已选装备则逐槽位对比差值。 */
function StatTooltip({
  equip,
  matched,
}: {
  equip: Equip
  matched?: EquipCardProps['matched']
}) {
  const selectedEquipId = useRefinementStore((s) => s.selectedEquipId)
  const selected = selectedEquipId ? equipById.get(selectedEquipId) ?? null : null
  const isSelf = selected?.id === equip.id

  return (
    <div className="text-xs">
      <div className="font-medium">
        {equip.name}
        <span className="ml-1 font-normal opacity-60">
          {equip.type} · {equip.setName}
        </span>
      </div>
      {SLOTS.map(({ label, pick }) => {
        const stat = pick(equip)
        if (!stat) {
          return (
            <div key={label} className="opacity-60">
              {label}：无
            </div>
          )
        }
        const target = !isSelf && selected ? pick(selected) : null
        let compare = ''
        if (target && target.key === stat.key && target.unit === stat.unit) {
          const diff = round1(stat.value - target.value)
          compare = `（已选 +${target.value}${target.unit}，${diff > 0 ? '+' : ''}${diff}）`
        } else if (target) {
          compare = `（已选：${fmt(target)}）`
        }
        return (
          <div key={label}>
            {label}：{fmt(stat)} {compare}
          </div>
        )
      })}
      {matched && (
        <div className="mt-1 text-[#ffd666]">
          匹配：{matched.slotLabel} {fmt(matched.attr)}
        </div>
      )}
      {isSelf && <div className="mt-1 opacity-60">当前已选装备</div>}
    </div>
  )
}

/**
 * 装备卡：大图标为主，属性数据在 tooltip 中（候选卡与已选装备逐槽位对比），
 * 名字下方为当前工艺下的制造材料。点击选中/取消。
 */
export const EquipCard = memo(function EquipCard({ equip, matched }: EquipCardProps) {
  const selectedEquipId = useRefinementStore((s) => s.selectedEquipId)
  const selectEquip = useRefinementStore((s) => s.selectEquip)
  const isSelected = selectedEquipId === equip.id

  return (
    <Tooltip title={<StatTooltip equip={equip} matched={matched} />} mouseEnterDelay={0.25}>
      <Card
        size="small"
        hoverable
        onClick={() => selectEquip(equip.id)}
        style={isSelected ? { borderColor: '#d48806' } : undefined}
        className="relative"
        styles={{ body: { padding: 3 } }}
        aria-pressed={isSelected}
      >
        {/* 右下角：加成数值（仅推荐卡）叠在类型标签上方 */}
        <Flex vertical align="flex-end" className="!absolute right-0 bottom-0">
          {matched && (
            <Tag
              color="#d48806"
              className="!m-0 !px-1 !text-[10px] !leading-4"
              style={{ borderRadius: 0 }}
            >
              +{matched.attr.value}
              {matched.attr.unit}
            </Tag>
          )}
          <Tag
            color={TYPE_COLORS[equip.type]}
            className="!m-0 !px-1 !text-[10px] !leading-4"
            style={{ borderRadius: 0, borderBottomRightRadius: 8 }}
          >
            {equip.type}
          </Tag>
        </Flex>
        <Flex gap={8} align="center">
          {/* 图标为主 */}
          <div
            className="relative shrink-0 overflow-hidden rounded-md border border-black/5 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.06]"
            style={{ width: 56, height: 56 }}
          >
            <Image
              src={`/images/equip/${equip.imageId}.avif`}
              alt={equip.name}
              fill
              sizes="56px"
              className="object-contain"
            />
          </div>

          <Flex vertical className="min-w-0 flex-1" gap={1}>
            <Typography.Text ellipsis className="!text-sm !font-medium" title={equip.name}>
              {equip.name}
            </Typography.Text>
            {/* 材料紧跟在装备名字下方（当前工艺下的制造材料） */}
            <EquipMaterialsRow equip={equip} size={40} />
          </Flex>
        </Flex>
      </Card>
    </Tooltip>
  )
})
