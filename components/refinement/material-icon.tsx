'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Flex, Tooltip } from 'antd'
import { MATERIAL_ICON_IDS } from '@/data/material-images'

const RARITY_COLORS: Record<number, string> = {
  1: '#9aa0a6',
  2: '#5ad8a6',
  3: '#5b8ff9',
  4: '#b37feb',
  5: '#f5a623',
}

interface MaterialIconProps {
  /** 中文名（tooltip 用）；未知时回退显示 itemId */
  name?: string
  iconId: string
  /** 数量未知（legacy 数据）时不显示 */
  count?: number
  size?: number
}

/** 材料/调度券图标：方形稀有度框 + 图标 + 下方数量。memo：工艺切换时材料未变化的实例跳过重渲染。 */
export const MaterialIcon = memo(function MaterialIcon({
  name,
  iconId,
  count,
  size = 40,
}: MaterialIconProps) {
  const label = name ?? MATERIAL_ICON_IDS_REVERSE[iconId] ?? iconId
  return (
    <Tooltip title={`${label}${count != null ? ` ×${count.toLocaleString()}` : ''}`}>
      <Flex vertical align="center" gap={2}>
        <div
          className="relative shrink-0 rounded-md border"
          style={{
            width: size,
            height: size,
            borderColor: RARITY_COLORS[rarityOf(iconId)],
            backgroundColor: 'rgba(128,128,128,0.08)',
          }}
        >
          <Image
            src={`/images/items/${iconId}.avif`}
            alt={label}
            width={size}
            height={size}
            className="object-contain"
          />
        </div>
        {count != null && (
          <span className="font-mono text-[10px] leading-3 text-black/60 dark:text-white/60">
            ×{count.toLocaleString()}
          </span>
        )}
      </Flex>
    </Tooltip>
  )
})

function rarityOf(iconId: string): number {
  // 调度券为绿品，装备原件为紫品
  if (iconId.includes('coupon')) return 2
  return 4
}

const MATERIAL_ICON_IDS_REVERSE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(MATERIAL_ICON_IDS).map(([name, id]) => [id, name]),
)
