'use client'

import { useState } from 'react'
import { Alert, Collapse, Empty, Flex, Tag, Tooltip, Typography } from 'antd'
import type { SlotRecommendation } from '@/types/refinement'
import { equipStatLabel } from '@/data/stat-labels'
import { EquipCard } from './equip-card'

const SLOT_LABELS: Record<string, string> = {
  sub1: '副属性1',
  sub2: '副属性2',
  special: '特殊属性',
}

const SLOT_COLORS: Record<string, string> = {
  sub1: 'blue',
  sub2: 'green',
  special: 'purple',
}

/**
 * 单个槽位的精锻推荐：折叠面板（默认展开），头部为目标属性 + 候选最高值，
 * 内容为候选装备网格（数值降序）。
 */
export function SlotRecommendationCard({ recommendation }: { recommendation: SlotRecommendation }) {
  const { slotKey, targetAttr, candidates, recommendSelf } =
    recommendation
  const topAttr = candidates[0]?.matchAttr
  const [expanded, setExpanded] = useState(true)

  if (!targetAttr) {
    return (
      <Flex align="center" gap={8} className="rounded-md border border-black/10 px-3 py-2 dark:border-white/15">
        <Tag color={SLOT_COLORS[slotKey]} className="!m-0">
          {SLOT_LABELS[slotKey]}
        </Tag>
        <Typography.Text type="secondary">该装备无此属性</Typography.Text>
      </Flex>
    )
  }

  return (
    <Collapse
      ghost
      size="small"
      className="[&_.ant-collapse-header]:!min-h-0 [&_.ant-collapse-header]:!py-1"
      activeKey={expanded ? [slotKey] : []}
      onChange={() => setExpanded((v) => !v)}
      items={[
        {
          key: slotKey,
          label: (
            <Flex align="center" gap={8}>
              <Tag color={SLOT_COLORS[slotKey]} className="!m-0">
                {SLOT_LABELS[slotKey]}
              </Tag>
              <Typography.Text type="secondary" className="!text-xs !font-normal">
                目标 {equipStatLabel(targetAttr.key)}
                <span className="font-medium text-[#d48806]">
                  +{targetAttr.value}
                  {targetAttr.unit}
                </span>
              </Typography.Text>
            </Flex>
          ),
          extra: topAttr ? (
            <Tooltip title="候选中最高属性值">
              <Typography.Text className="!font-medium text-[#d48806]">
                Max {equipStatLabel(topAttr.key)} +{topAttr.value}
                {topAttr.unit}
              </Typography.Text>
            </Tooltip>
          ) : undefined,
          children: (
            <Flex vertical gap={8}>
              {recommendSelf && candidates.length > 0 && (
                <Alert type="success" showIcon title="当前属性已达该类型上限，展示同属性装备" />
              )}

              {candidates.length === 0 ? (
                <Empty description="无候选装备" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, 200px)' }}
                >
                  {candidates.map((candidate) => (
                    <EquipCard
                      key={candidate.equip.id}
                      equip={candidate.equip}
                      matched={{
                        slotLabel: SLOT_LABELS[candidate.matchSlotKey],
                        attr: candidate.matchAttr,
                      }}
                    />
                  ))}
                </div>
              )}
            </Flex>
          ),
        },
      ]}
    />
  )
}
