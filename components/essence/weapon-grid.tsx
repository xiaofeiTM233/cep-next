'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Drawer, Empty, Flex, Input, Segmented, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { Weapon } from '@/types/matrix'
import { weaponStatLabel } from '@/data/stat-labels'
import { useMatrixStore } from '@/stores/useMatrixStore'
import {
  useEssenceSettingsStore,
  CARD_SIZE_PX,
  type CardSize,
} from '@/stores/useEssenceSettingsStore'
import { weapons as staticWeapons } from '@/data/weapons'
import {
  ELEMENTAL_STAT_OPTIONS,
  PRIMARY_STAT_OPTIONS,
  SPECIAL_STAT_OPTIONS,
} from '@/lib/essence-utils'
import { WeaponCard } from './weapon-card'

type FilterKey = 'weaponType' | 'primaryStat' | 'elementalDamage' | 'specialAbility'

const FILTER_KEYS: FilterKey[] = ['weaponType', 'primaryStat', 'elementalDamage', 'specialAbility']

/** 候选值由数据派生：类型取自武器，属性取自副本池。 */
function buildFilterOptions(allWeapons: Weapon[]): Record<FilterKey, string[]> {
  return {
    weaponType: [...new Set(allWeapons.map((w) => w.type))].sort(),
    primaryStat: PRIMARY_STAT_OPTIONS,
    elementalDamage: ELEMENTAL_STAT_OPTIONS,
    specialAbility: SPECIAL_STAT_OPTIONS,
  }
}

function weaponAttrValue(weapon: Weapon, key: FilterKey): string | null {
  switch (key) {
    case 'weaponType':
      return weapon.type
    case 'primaryStat':
      return weapon.primaryStat
    case 'elementalDamage':
      return weapon.elementalDamage
    case 'specialAbility':
      return weapon.specialAbility
  }
}

const FILTER_PLACEHOLDERS: Record<FilterKey, string> = {
  weaponType: '类型',
  primaryStat: '基础属性',
  elementalDamage: '附加属性',
  specialAbility: '技能属性',
}

/**
 * 武器选择：搜索 + 多选下拉筛选 + 卡片网格 + 已选清单抽屉。
 */
export const WeaponGrid = memo(function WeaponGrid() {
  const searchQuery = useMatrixStore((s) => s.weaponSearchQuery)
  const setSearchQuery = useMatrixStore((s) => s.setWeaponSearchQuery)
  const attrFilters = useMatrixStore((s) => s.weaponAttrFilters)
  const setAttrFilters = useMatrixStore((s) => s.setWeaponAttrFilters)
  const selectedWeaponIds = useMatrixStore((s) => s.selectedWeaponIds)
  const setVisibleWeaponIds = useMatrixStore((s) => s.setVisibleWeaponIds)

  const customWeapons = useEssenceSettingsStore((s) => s.customWeapons)
  const cardSize = useEssenceSettingsStore((s) => s.cardSize)
  const setCardSize = useEssenceSettingsStore((s) => s.setCardSize)
  const allWeapons = useMemo(() => [...staticWeapons, ...customWeapons], [customWeapons])
  const filterOptions = useMemo(() => buildFilterOptions(allWeapons), [allWeapons])

  const selectedSet = useMemo(() => new Set(selectedWeaponIds), [selectedWeaponIds])

  const filteredWeapons = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    return allWeapons.filter((w) => {
      if (term && ![w.name, w.type].some((v) => v.toLowerCase().includes(term))) {
        return false
      }
      for (const key of FILTER_KEYS) {
        const selected = attrFilters[key] ?? []
        if (selected.length === 0) continue
        const value = weaponAttrValue(w, key)
        if (value === null || !selected.includes(value)) return false
      }
      return true
    })
  }, [allWeapons, searchQuery, attrFilters])

  // 同步可见武器 id，供"全选可见"使用
  useEffect(() => {
    setVisibleWeaponIds(filteredWeapons.map((w) => w.id))
  }, [filteredWeapons, setVisibleWeaponIds])

  const activeFilterCount = FILTER_KEYS.reduce(
    (sum, key) => sum + (attrFilters[key]?.length ?? 0),
    0,
  )

  return (
    <Flex vertical gap={12}>
      {/* 常驻工具条：搜索 + 快捷操作 */}
      <Flex gap={8} className="sticky top-0 z-10 bg-[var(--background)] pb-1">
        <Input
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索武器..."
          prefix={<SearchOutlined className="text-black/25 dark:text-white/25" />}
        />
        <Badge count={selectedWeaponIds.length} color="#d48806" overflowCount={999}>
          <Button disabled={selectedWeaponIds.length === 0}>已选清单</Button>
        </Badge>
      </Flex>

      <SelectedListDrawer />

      {/* 多选下拉筛选：常驻可见，placeholder 即标签 */}
      <Flex wrap gap={8}>
        {FILTER_KEYS.map((key) => (
          <Select
            key={key}
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            value={attrFilters[key] ?? []}
            onChange={(values) => setAttrFilters({ ...attrFilters, [key]: values })}
            placeholder={FILTER_PLACEHOLDERS[key]}
            options={filterOptions[key].map((value) => ({
              value,
              label: key === 'weaponType' ? value : weaponStatLabel(value),
            }))}
            className={key === 'weaponType' ? 'w-28' : 'min-w-32 flex-1'}
            popupMatchSelectWidth={false}
          />
        ))}
        {activeFilterCount > 0 && (
          <Button type="link" size="small" className="!px-0" onClick={() => setAttrFilters({})}>
            清空筛选
          </Button>
        )}
      </Flex>

      <Flex gap={8} align="center" wrap>
        <Button onClick={() => useMatrixStore.getState().selectAllWeapons(
          useMatrixStore.getState().visibleWeaponIds,
        )}>
          全选可见
        </Button>
        <Button danger disabled={selectedWeaponIds.length === 0} onClick={() => useMatrixStore.getState().clearWeapons()}>
          清空
        </Button>
        <Segmented
          size="small"
          value={cardSize}
          onChange={(v) => setCardSize(v as CardSize)}
          options={[
            { value: 'small', label: '小' },
            { value: 'middle', label: '中' },
            { value: 'large', label: '大' },
          ]}
        />
        <span className="ml-auto text-xs text-black/45 dark:text-white/45">
          共 {filteredWeapons.length} 把
        </span>
      </Flex>

      {/* 武器网格：固定卡宽，拖拽分栏只改变列数 */}
      {filteredWeapons.length === 0 ? (
        <Empty description="没有匹配的武器" />
      ) : (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(auto-fill, ${CARD_SIZE_PX[cardSize]}px)` }}
        >
          {filteredWeapons.map((weapon) => (
            <WeaponCard key={weapon.id} weapon={weapon} isSelected={selectedSet.has(weapon.id)} />
          ))}
        </div>
      )}
    </Flex>
  )
})

/** 已选清单抽屉：点卡片移除；顶部可全选可见/清空。 */
function SelectedListDrawer() {
  const [open, setOpen] = useState(false)
  const selectedWeaponIds = useMatrixStore((s) => s.selectedWeaponIds)
  const selectAllWeapons = useMatrixStore((s) => s.selectAllWeapons)
  const clearWeapons = useMatrixStore((s) => s.clearWeapons)
  const visibleWeaponIds = useMatrixStore((s) => s.visibleWeaponIds)
  const customWeapons = useEssenceSettingsStore((s) => s.customWeapons)

  const allWeaponsMap = useMemo(() => {
    const map = new Map<string, Weapon>()
    for (const w of staticWeapons) map.set(w.id, w)
    for (const w of customWeapons) map.set(w.id, w)
    return map
  }, [customWeapons])

  const selectedSet = useMemo(() => new Set(selectedWeaponIds), [selectedWeaponIds])

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      size={460}
      title={`已选 ${selectedWeaponIds.length} 把`}
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={() => selectAllWeapons(visibleWeaponIds)}>全选可见</Button>
          <Button danger onClick={clearWeapons} disabled={selectedWeaponIds.length === 0}>
            清空
          </Button>
        </Flex>
      }
    >
      {selectedWeaponIds.length === 0 ? (
        <Empty description="选择武器以查看推荐方案" />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {selectedWeaponIds.map((id) => {
            const weapon = allWeaponsMap.get(id)
            if (!weapon) return null
            return (
              <WeaponCard key={id} weapon={weapon} isSelected={selectedSet.has(id)} />
            )
          })}
        </div>
      )}
    </Drawer>
  )
}
