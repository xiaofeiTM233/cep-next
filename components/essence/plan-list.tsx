'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { Alert, Button, Collapse, Empty, Flex, Image as AntImage, Spin, Table, Tag, Tooltip } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import { useShallow } from 'zustand/react/shallow'
import { useMatrixStore, getPlanKey } from '@/stores/useMatrixStore'
import { useEssenceSettingsStore } from '@/stores/useEssenceSettingsStore'
import { CheckPill } from '@/components/check-pill'
import { PlanWeaponCard } from '@/components/essence/plan-weapon-card'
import { dungeons, getRegion, getRegions, getSubRegion, getSubRegions } from '@/data/dungeons'
import { weapons as staticWeapons } from '@/data/weapons'
import { RARITY_COLORS, isWeaponVisibleInPlans, weaponImageSrc } from '@/lib/essence-utils'
import { computeEffectiveS1 } from '@/lib/planner/s1-utils'
import { LOCK_TYPE_LABELS, weaponStatLabel } from '@/data/stat-labels'
import type { DungeonPlan, WeaponMatch } from '@/lib/planner/essence-solver'
import type { Weapon } from '@/types/matrix'

const LOCK_COLORS = { s2: 'blue', s3: 'purple', none: 'default' } as const

const S1_HINT = '最多锁定 3 种基础属性'

/**
 * 方案列表：地区/子地区筛选 + antd Collapse（受控、默认展开最优方案）
 * + 展开内容为 S1 锁定行、武器缩略图与可勾选的武器明细 Table。
 */
export const PlanList = memo(function PlanList() {
  const plansMap = useMatrixStore((s) => s.plansMap)
  const planOrder = useMatrixStore((s) => s.planOrder)
  const plansStale = useMatrixStore((s) => s.plansStale)
  const selectedWeaponIds = useMatrixStore((s) => s.selectedWeaponIds)
  const collapsedPlanKeys = useMatrixStore((s) => s.collapsedPlanKeys)
  const setCollapsedPlanKeys = useMatrixStore((s) => s.setCollapsedPlanKeys)
  const storeSelectedRegions = useMatrixStore((s) => s.selectedRegions)
  const storeSelectedSubRegions = useMatrixStore((s) => s.selectedSubRegions)
  const setSelectedRegions = useMatrixStore((s) => s.setSelectedRegions)
  const setSelectedSubRegions = useMatrixStore((s) => s.setSelectedSubRegions)

  const regionFirst = useEssenceSettingsStore((s) => s.regionFirst)
  const regionSecond = useEssenceSettingsStore((s) => s.regionSecond)
  const visibilityFlags = useEssenceSettingsStore(
    useShallow((s) => ({
      hideFourStarPlans: s.hideFourStarWeaponsPlans,
      hideThreeStarPlans: s.hideThreeStarWeaponsPlans,
      hideUnownedPlans: s.hideUnownedWeaponsPlans,
      hideEssenceOwnedPlans: s.hideEssenceOwnedWeaponsPlans,
      onlyBothOwnedPlans: s.onlyHideWhenBothOwnedPlans,
      weaponOwnership: s.weaponOwnership,
      essenceStatus: s.essenceStatus,
    })),
  )

  const customWeapons = useEssenceSettingsStore((s) => s.customWeapons)
  const allWeaponsMap = useMemo(() => {
    const map = new Map<string, { name: string }>()
    for (const w of staticWeapons) map.set(w.id, w)
    for (const w of customWeapons) map.set(w.id, w)
    return map
  }, [customWeapons])

  const selectedRegions = useMemo(() => new Set(storeSelectedRegions), [storeSelectedRegions])
  const selectedSubRegions = useMemo(() => new Set(storeSelectedSubRegions), [storeSelectedSubRegions])

  const regions = useMemo(() => getRegions(dungeons), [])
  const subRegionsByRegion = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const r of regions) map.set(r, getSubRegions(dungeons, r))
    return map
  }, [regions])

  const countPlanWeapons = useCallback(
    (plan: DungeonPlan, selectedOnly: boolean): number => {
      let count = 0
      for (const { weapon, isSelected } of plan.matchedWeapons) {
        if (selectedOnly && !isSelected) continue
        if (isWeaponVisibleInPlans(weapon, visibilityFlags)) count++
      }
      return count
    },
    [visibilityFlags],
  )

  // 排序：地区优先级 → 可见已选数 → 可见总数
  const sortedPlanOrder = useMemo(() => {
    const order = planOrder.filter((key) => Boolean(plansMap[key]))

    const planRegions = new Map<string, string>()
    for (const key of order) {
      const plan = plansMap[key]
      if (plan) planRegions.set(key, getRegion(plan.dungeon))
    }

    order.sort((a, b) => {
      const planA = plansMap[a]
      const planB = plansMap[b]
      if (!planA || !planB) return 0

      if (regionFirst) {
        const regionA = planRegions.get(a) ?? ''
        const regionB = planRegions.get(b) ?? ''
        const rankA = regionA === regionFirst ? 0 : regionA === regionSecond ? 1 : 2
        const rankB = regionB === regionFirst ? 0 : regionB === regionSecond ? 1 : 2
        if (rankA !== rankB) return rankA - rankB
      }

      const selDiff = countPlanWeapons(planB, true) - countPlanWeapons(planA, true)
      if (selDiff !== 0) return selDiff
      return countPlanWeapons(planB, false) - countPlanWeapons(planA, false)
    })

    return order
  }, [planOrder, plansMap, regionFirst, regionSecond, countPlanWeapons])

  // 默认全部展开；Collapse onChange 时只记录用户手动收起的 key（见下方 Collapse）

  const filteredPlanOrder = useMemo(() => {
    if (selectedRegions.size === 0 && selectedSubRegions.size === 0) return sortedPlanOrder
    return sortedPlanOrder.filter((key) => {
      const plan = plansMap[key]
      if (!plan) return false
      const region = getRegion(plan.dungeon)
      const subRegion = getSubRegion(plan.dungeon)
      if (selectedRegions.size > 0 && !selectedRegions.has(region)) return false
      if (selectedSubRegions.size > 0 && !selectedSubRegions.has(subRegion)) return false
      return true
    })
  }, [sortedPlanOrder, plansMap, selectedRegions, selectedSubRegions])

  const weaponsNotCovered = useMemo(() => {
    if (selectedWeaponIds.length === 0) return []
    if (selectedRegions.size === 0 && selectedSubRegions.size === 0) return []
    const covered = new Set<string>()
    for (const key of filteredPlanOrder) {
      const plan = plansMap[key]
      if (!plan) continue
      for (const { weapon, isSelected } of plan.matchedWeapons) {
        if (isSelected) covered.add(weapon.id)
      }
    }
    return selectedWeaponIds.filter((id) => !covered.has(id))
  }, [filteredPlanOrder, selectedWeaponIds, plansMap, selectedRegions, selectedSubRegions])

  // ── 地区筛选交互 ──
  const toggleRegion = useCallback(
    (region: string) => {
      const idx = storeSelectedRegions.indexOf(region)
      if (idx >= 0) {
        setSelectedRegions(storeSelectedRegions.filter((r) => r !== region))
        const subs = new Set(subRegionsByRegion.get(region) ?? [])
        setSelectedSubRegions(storeSelectedSubRegions.filter((s) => !subs.has(s)))
      } else {
        setSelectedRegions([...storeSelectedRegions, region])
      }
    },
    [storeSelectedRegions, storeSelectedSubRegions, setSelectedRegions, setSelectedSubRegions, subRegionsByRegion],
  )

  const toggleSubRegion = useCallback(
    (region: string, sub: string) => {
      const idx = storeSelectedSubRegions.indexOf(sub)
      let next: string[]
      if (idx >= 0) {
        next = storeSelectedSubRegions.filter((s) => s !== sub)
      } else {
        next = [...storeSelectedSubRegions, sub]
        const subs = subRegionsByRegion.get(region) ?? []
        if (subs.every((s) => next.includes(s))) {
          const subSet = new Set(subs)
          next = next.filter((s) => !subSet.has(s))
        }
      }
      setSelectedSubRegions(next)
    },
    [storeSelectedSubRegions, setSelectedSubRegions, subRegionsByRegion],
  )

  const clearRegionFilters = useCallback(() => {
    setSelectedRegions([])
    setSelectedSubRegions([])
  }, [setSelectedRegions, setSelectedSubRegions])

  const noWeaponsSelected = selectedWeaponIds.length === 0
  const hasRegionFilter = selectedRegions.size > 0 || selectedSubRegions.size > 0

  // 默认全部展开：activeKey = 全部方案 key - 用户手动收起的 key
  const activeKeys = filteredPlanOrder.filter((key) => !collapsedPlanKeys.includes(key))

  const collapseItems = filteredPlanOrder
    .map((planKey) => {
      const plan = plansMap[planKey]
      if (!plan) return null
      return {
        key: planKey,
        label: <PlanLabel plan={plan} />,
        children: <PlanContent plan={plan} visibleCandidatesFilter={visibilityFlags} />,
      }
    })
    .filter((item) => item !== null)

  return (
    <Flex vertical gap={12}>
      {/* 地区筛选条 */}
      <Flex wrap gap={4} align="center" className="sticky top-0 z-10 bg-[var(--background)] pb-1">
        <span className="mr-1 shrink-0 text-xs text-black/45 dark:text-white/45">地区筛选</span>
        <CheckPill checked={!hasRegionFilter} onChange={clearRegionFilters}>
          全部
        </CheckPill>
        {regions.map((region) => (
          <CheckPill
            key={region}
            checked={selectedRegions.has(region)}
            onChange={() => toggleRegion(region)}
          >
            {region}
          </CheckPill>
        ))}
        {hasRegionFilter && (
          <Button type="link" size="small" className="!px-1" onClick={clearRegionFilters}>
            清空
          </Button>
        )}
      </Flex>

      {/* 已选地区的子地区行 */}
      {storeSelectedRegions.map((region) => {
        const subs = subRegionsByRegion.get(region) ?? []
        if (subs.length === 0) return null
        const allActive = subs.every((s) => !selectedSubRegions.has(s))
        return (
          <Flex key={region} wrap gap={4} align="center">
            <span className="w-16 shrink-0 text-right text-xs text-black/45 dark:text-white/45">
              {region}
            </span>
            <CheckPill
              checked={allActive}
              onChange={() => {
                if (!allActive) {
                  const subSet = new Set(subs)
                  setSelectedSubRegions(storeSelectedSubRegions.filter((s) => !subSet.has(s)))
                }
              }}
            >
              全部
            </CheckPill>
            {subs.map((sub) => (
              <CheckPill
                key={sub}
                checked={selectedSubRegions.has(sub)}
                onChange={() => toggleSubRegion(region, sub)}
              >
                {sub}
              </CheckPill>
            ))}
          </Flex>
        )
      })}

      {/* 方案内容 */}
      {noWeaponsSelected ? (
        <Empty description="选择武器以查看推荐方案" className="py-16" />
      ) : sortedPlanOrder.length === 0 ? (
        <Flex justify="center" className="py-16">
          {plansStale ? (
            <Spin description="正在计算方案...">
              <div className="h-16 w-64" />
            </Spin>
          ) : (
            <Empty description="当前筛选条件下无匹配方案" />
          )}
        </Flex>
      ) : (
        <>
          {weaponsNotCovered.length > 0 && (
            <Alert
              type="warning"
              showIcon
              title={`当前地区筛选下，"${weaponsNotCovered
                .map((id) => allWeaponsMap.get(id)?.name ?? id)
                .join('、')}"无可刷方案`}
            />
          )}
          {filteredPlanOrder.length === 0 ? (
            <Empty description="当前筛选条件下无匹配方案" />
          ) : (
            <Collapse
              size="small"
              activeKey={activeKeys}
              onChange={(keys) => {
                const active = Array.isArray(keys) ? keys : [keys]
                setCollapsedPlanKeys(filteredPlanOrder.filter((key) => !active.includes(key)))
              }}
              items={collapseItems}
            />
          )}
        </>
      )}
    </Flex>
  )
})

/** Collapse 标题：副本名 + 锁定词条 + 已选/总计。 */
function PlanLabel({ plan }: { plan: DungeonPlan }) {
  return (
    <Flex wrap gap={8} align="center">
      <span className="text-sm font-medium">{plan.dungeon.name}</span>
      {plan.lockType !== 'none' ? (
        <Tag color={LOCK_COLORS[plan.lockType]} className="!m-0">
          {LOCK_TYPE_LABELS[plan.lockType]}：{weaponStatLabel(plan.lockValue)}
        </Tag>
      ) : (
        <Tag className="!m-0">{LOCK_TYPE_LABELS.none}</Tag>
      )}
      <Tag color={plan.selectedCount > 0 ? 'gold' : 'default'} className="!m-0">
        已选 {plan.selectedCount} / {plan.totalCount}
      </Tag>
    </Flex>
  )
}

/** Collapse 内容：S1 锁定 + 缩略图 + 武器明细 Table。 */
function PlanContent({
  plan,
  visibleCandidatesFilter,
}: {
  plan: DungeonPlan
  visibleCandidatesFilter: Parameters<typeof isWeaponVisibleInPlans>[1]
}) {
  const storedS1 = useMatrixStore((s) => s.dungeonS1Selections[getPlanKey(plan)])
  const setDungeonS1Selection = useMatrixStore((s) => s.setDungeonS1Selection)

  // S1 候选中实际可见（未被隐藏开关过滤）的子集
  const visibleCandidates = useMemo(
    () =>
      plan.s1Candidates.filter((s1) =>
        plan.matchedWeapons.some(
          (m) =>
            m.weapon.primaryStat === s1 &&
            isWeaponVisibleInPlans(m.weapon, visibleCandidatesFilter),
        ),
      ),
    [plan, visibleCandidatesFilter],
  )

  const effectiveS1 = useMemo(
    () => computeEffectiveS1(storedS1, plan.selectedS1, visibleCandidates),
    [storedS1, plan.selectedS1, visibleCandidates],
  )

  const needsS1Choice = visibleCandidates.length > 3
  const planKey = getPlanKey(plan)

  const toggleS1 = (s1: string) => {
    if (effectiveS1.includes(s1)) {
      const next = effectiveS1.filter((v) => v !== s1)
      if (next.length > 0) setDungeonS1Selection(planKey, next)
    } else if (effectiveS1.length < 3) {
      setDungeonS1Selection(planKey, [...effectiveS1, s1])
    }
  }

  return (
    <Flex vertical gap={8}>
      {/* S1 锁定选择 */}
      <Flex wrap gap={4} align="center">
        <span className="text-xs text-black/45 dark:text-white/45">基础属性</span>
        {visibleCandidates.map((s1) => (
          <Tooltip key={s1} title={needsS1Choice ? S1_HINT : weaponStatLabel(s1)}>
            <CheckPill
              checked={effectiveS1.includes(s1)}
              onChange={() => toggleS1(s1)}
            >
              {weaponStatLabel(s1)}
            </CheckPill>
          </Tooltip>
        ))}
        {needsS1Choice && (
          <span className="text-xs text-black/45 dark:text-white/45">
            可覆盖 {visibleCandidates.length} 种，{S1_HINT}
          </span>
        )}
      </Flex>

      {/* 武器卡片：已选在前由排序保证；生效 S1 之外降透明度 */}
      <Flex wrap gap={6} align="flex-start">
        {plan.matchedWeapons.map(({ weapon, isSelected }) => (
          <PlanWeaponCard
            key={weapon.id}
            weapon={weapon}
            isSelected={isSelected}
            inRange={weapon.primaryStat === null || effectiveS1.includes(weapon.primaryStat)}
          />
        ))}
      </Flex>

      {/* 武器明细 Table：默认折叠 */}
      <PlanWeaponTableToggle plan={plan} />
    </Flex>
  )
}

/** 明细表格：默认折叠，点击"展开明细"显示。 */
function PlanWeaponTableToggle({ plan }: { plan: DungeonPlan }) {
  const [showTable, setShowTable] = useState(false)

  return (
    <Flex vertical gap={4}>
      <Button
        type="link"
        size="small"
        className="!self-start !px-0"
        icon={showTable ? <UpOutlined /> : <DownOutlined />}
        iconPlacement="end"
        onClick={() => setShowTable((v) => !v)}
      >
        {showTable ? '收起明细' : `展开明细（${plan.matchedWeapons.length} 把）`}
      </Button>
      {showTable && <PlanWeaponTable plan={plan} />}
    </Flex>
  )
}

interface PlanWeaponRow extends WeaponMatch {
  key: string
}

function PlanWeaponTable({ plan }: { plan: DungeonPlan }) {
  const toggleWeapon = useMatrixStore((s) => s.toggleWeapon)
  const dataSource: PlanWeaponRow[] = plan.matchedWeapons.map((m) => ({
    ...m,
    key: m.weapon.id,
  }))
  const selectedRowKeys = dataSource.filter((r) => r.isSelected).map((r) => r.key)

  const columns: TableColumnsType<PlanWeaponRow> = [
    {
      title: '武器',
      dataIndex: ['weapon', 'name'],
      // 不设宽度：占据剩余全部空间
      render: (_, record) => (
        <Flex align="center" gap={8}>
          <WeaponThumbImage weapon={record.weapon} size={36} />
          <span
            className="whitespace-nowrap"
            style={{ color: record.isSelected ? RARITY_COLORS[record.weapon.rarity] : undefined }}
          >
            {record.weapon.name}
          </span>
        </Flex>
      ),
    },
    {
      title: '类型',
      dataIndex: ['weapon', 'type'],
      width: 84,
      render: (type: string) => <Tag className="!m-0">{type}</Tag>,
    },
    {
      title: '基础',
      width: 108,
      render: (_, r) => <span className="whitespace-nowrap">{weaponStatLabel(r.weapon.primaryStat)}</span>,
    },
    {
      title: '附加',
      width: 170,
      render: (_, r) => <span className="whitespace-nowrap">{weaponStatLabel(r.weapon.elementalDamage)}</span>,
    },
    {
      title: '技能',
      width: 130,
      render: (_, r) => <span className="whitespace-nowrap">{weaponStatLabel(r.weapon.specialAbility)}</span>,
    },
    {
      title: '标记',
      key: 'marks',
      width: 96,
      render: (_, r) => <OwnershipMarks weaponId={r.weapon.id} />,
    },
  ]

  return (
    <Table<PlanWeaponRow>
      size="small"
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      rowKey="key"
      scroll={{ x: 720 }}
      rowSelection={{
        selectedRowKeys,
        onSelect: (record) => toggleWeapon(record.weapon.id),
        onSelectAll: (_selected, _selectedRows, changeRows) => {
          changeRows.forEach((row) => toggleWeapon(row.weapon.id))
        },
        selections: true,
      }}
      locale={{ emptyText: <Empty description="无匹配武器" /> }}
    />
  )
}

function OwnershipMarks({ weaponId }: { weaponId: string }) {
  const weaponOwned = useEssenceSettingsStore((s) => s.weaponOwnership[weaponId] === true)
  const essenceOwned = useEssenceSettingsStore((s) => s.essenceStatus[weaponId] === true)
  const setWeaponOwnership = useEssenceSettingsStore((s) => s.setWeaponOwnership)
  const setEssenceStatus = useEssenceSettingsStore((s) => s.setEssenceStatus)

  return (
    <Flex gap={4}>
      <Tooltip title={weaponOwned ? '已拥有武器（点击取消）' : '标记拥有武器'}>
        <CheckPill
          small
          checked={weaponOwned}
          onChange={(checked) => setWeaponOwnership(weaponId, checked)}
        >
          武
        </CheckPill>
      </Tooltip>
      <Tooltip title={essenceOwned ? '已有基质（点击取消）' : '标记已有基质'}>
        <CheckPill
          small
          checked={essenceOwned}
          onChange={(checked) => setEssenceStatus(weaponId, checked)}
        >
          基
        </CheckPill>
      </Tooltip>
    </Flex>
  )
}

function WeaponThumbImage({ weapon, size }: { weapon: Weapon; size: number }) {
  const imageSrc = weaponImageSrc(weapon.id, weapon.iconId)
  if (!imageSrc) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{ width: size, height: size }}
        className="shrink-0 rounded bg-black/5 text-xs text-black/30 dark:bg-white/10 dark:text-white/30"
      >
        {weapon.name.slice(0, 1)}
      </Flex>
    )
  }
  return (
    <AntImage
      src={imageSrc}
      alt={weapon.name}
      width={size}
      height={size}
      preview={false}
      className="shrink-0 [&.ant-image img]:object-contain"
      style={{ objectFit: 'contain' }}
    />
  )
}
