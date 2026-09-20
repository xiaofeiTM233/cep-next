'use client'

import { useMemo } from 'react'
import { Divider, Drawer, Form, Select, Switch } from 'antd'
import { useEssenceSettingsStore } from '@/stores/useEssenceSettingsStore'
import { dungeons, getRegions } from '@/data/dungeons'

interface EssenceSettingsDrawerProps {
  open: boolean
  onClose: () => void
}

const SWITCH_ITEMS = [
  { key: 'hideFourStarWeaponsPlans', label: '隐藏 4 星武器方案' },
  { key: 'hideThreeStarWeaponsPlans', label: '隐藏 3 星武器方案' },
  { key: 'hideUnownedWeaponsPlans', label: '隐藏未拥有武器的方案' },
  { key: 'hideEssenceOwnedWeaponsPlans', label: '隐藏已有基质的方案' },
  { key: 'onlyHideWhenBothOwnedPlans', label: '仅在武器与基质都已拥有时隐藏' },
] as const

/** 基质规划设置抽屉：地区优先级 + 方案隐藏开关。 */
export function EssenceSettingsDrawer({ open, onClose }: EssenceSettingsDrawerProps) {
  const regionFirst = useEssenceSettingsStore((s) => s.regionFirst)
  const regionSecond = useEssenceSettingsStore((s) => s.regionSecond)
  const setRegionFirst = useEssenceSettingsStore((s) => s.setRegionFirst)
  const setRegionSecond = useEssenceSettingsStore((s) => s.setRegionSecond)
  const hideFourStar = useEssenceSettingsStore((s) => s.hideFourStarWeaponsPlans)
  const hideThreeStar = useEssenceSettingsStore((s) => s.hideThreeStarWeaponsPlans)
  const hideUnowned = useEssenceSettingsStore((s) => s.hideUnownedWeaponsPlans)
  const hideEssenceOwned = useEssenceSettingsStore((s) => s.hideEssenceOwnedWeaponsPlans)
  const onlyBothOwned = useEssenceSettingsStore((s) => s.onlyHideWhenBothOwnedPlans)
  const flagValues = {
    hideFourStarWeaponsPlans: hideFourStar,
    hideThreeStarWeaponsPlans: hideThreeStar,
    hideUnownedWeaponsPlans: hideUnowned,
    hideEssenceOwnedWeaponsPlans: hideEssenceOwned,
    onlyHideWhenBothOwnedPlans: onlyBothOwned,
  } as const
  const setFlag = useEssenceSettingsStore((s) => s.setFlag)

  const regions = useMemo(() => getRegions(dungeons), [])
  const regionOptions = regions.map((r) => ({ value: r, label: r }))

  return (
    <Drawer open={open} onClose={onClose} title="基质规划设置" size={360}>
      <div className="text-sm font-medium">地区优先级</div>
      <div className="mt-1 text-xs text-black/45 dark:text-white/45">
        方案按优先地区排序：第一优先 → 第二优先 → 其他
      </div>
      <Form layout="vertical" className="mt-2">
        <Form.Item label="第一优先地区" className="!mb-3">
          <Select
            allowClear
            placeholder="不优先"
            value={regionFirst}
            options={regionOptions}
            onChange={(v) => setRegionFirst(v ?? null)}
          />
        </Form.Item>
        <Form.Item label="第二优先地区" className="!mb-0">
          <Select
            allowClear
            placeholder="不优先"
            value={regionSecond}
            options={regionOptions}
            onChange={(v) => setRegionSecond(v ?? null)}
          />
        </Form.Item>
      </Form>

      <Divider />

      <div className="text-sm font-medium">方案筛选</div>
      <div className="mt-2 flex flex-col gap-3">
        {SWITCH_ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <span className="text-sm">{label}</span>
            <Switch
              size="small"
              checked={flagValues[key]}
              onChange={(checked) => setFlag(key, checked)}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-black/45 dark:text-white/45">
        隐藏的武器不参与方案排序权重与 S1 统计，但仍在武器列表中可选。
      </div>
    </Drawer>
  )
}
