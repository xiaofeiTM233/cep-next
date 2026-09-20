'use client'

import { Flex, Segmented } from 'antd'
import { MATERIAL_ICON_IDS } from '@/data/material-images'
import { useRefinementStore } from '@/stores/useRefinementStore'

/** 工艺切换选项：默认工艺 + 四种装备原件 */
const CRAFT_OPTIONS: { value: string; label: string; iconId?: string }[] = [
  { value: '', label: '默认工艺' },
  ...Object.keys(MATERIAL_ICON_IDS)
    .filter((name) => name.includes('装备原件'))
    .map((name) => ({
      value: name,
      label: name.replace('装备原件', ''),
      iconId: MATERIAL_ICON_IDS[name],
    })),
]

interface CraftSwitcherProps {
  /** 是否显示"制造工艺"标签 */
  labeled?: boolean
}

/** 全局制造工艺切换器：所有装备卡与推荐面板的材料随之变化。 */
export function CraftSwitcher({ labeled = true }: CraftSwitcherProps) {
  const craftMaterial = useRefinementStore((s) => s.craftMaterial)
  const setCraftMaterial = useRefinementStore((s) => s.setCraftMaterial)

  return (
    <Flex vertical gap={4}>
      {labeled && (
        <span className="text-xs text-black/45 dark:text-white/45">制造工艺</span>
      )}
      <Segmented
        value={craftMaterial ?? ''}
        onChange={(v) => setCraftMaterial((v as string) || null)}
        options={CRAFT_OPTIONS.map((opt) => ({
          value: opt.value,
          label: (
            <Flex align="center" gap={4}>
              {opt.iconId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/images/items/${opt.iconId}.avif`}
                  alt=""
                  width={18}
                  height={18}
                  className="object-contain"
                />
              )}
              {opt.label}
            </Flex>
          ),
        }))}
      />
    </Flex>
  )
}
