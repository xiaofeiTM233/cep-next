'use client'

import { memo, useMemo } from 'react'
import { Badge, Button, Collapse, Empty, Flex, Input, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useGroupedSets, useRefinementStore } from '@/stores/useRefinementStore'
import { sub1StatOptions, sub2StatOptions, specialStatOptions } from '@/data/equips'
import { equipStatLabel } from '@/data/stat-labels'
import { EquipCard } from './equip-card'

type FilterKey = 'sub1' | 'sub2' | 'special'

const FILTERS: { key: FilterKey; placeholder: string; options: string[] }[] = [
  { key: 'sub1', placeholder: '副属性1', options: sub1StatOptions },
  { key: 'sub2', placeholder: '副属性2', options: sub2StatOptions },
  { key: 'special', placeholder: '特殊属性', options: specialStatOptions },
]

/**
 * 装备列表：搜索 + 工艺切换 + 多选下拉属性筛选 + 按套组平铺（不折叠）。
 */
export const EquipList = memo(function EquipList() {
  const searchQuery = useRefinementStore((s) => s.searchQuery)
  const setSearchQuery = useRefinementStore((s) => s.setSearchQuery)
  const filterSub1 = useRefinementStore((s) => s.filterSub1)
  const filterSub2 = useRefinementStore((s) => s.filterSub2)
  const filterSpecial = useRefinementStore((s) => s.filterSpecial)
  const setFilter = useRefinementStore((s) => s.setFilter)
  const clearFilters = useRefinementStore((s) => s.clearFilters)
  const groups = useGroupedSets()
  const expandedSets = useRefinementStore((s) => s.expandedSets)
  const toggleSetExpanded = useRefinementStore((s) => s.toggleSetExpanded)

  const filterValues: Record<FilterKey, string[]> = useMemo(
    () => ({ sub1: filterSub1, sub2: filterSub2, special: filterSpecial }),
    [filterSub1, filterSub2, filterSpecial],
  )

  const activeFilterCount = FILTERS.reduce(
    (sum, f) => sum + filterValues[f.key].length,
    0,
  )
  const total = groups.reduce((sum, g) => sum + g.equips.length, 0)

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap className="sticky top-0 z-10 bg-[var(--background)] pb-1">
        <Input
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索装备名称/套组/类型..."
          prefix={<SearchOutlined className="text-black/25 dark:text-white/25" />}
        />
      </Flex>

      {/* 属性筛选：常驻多选下拉 */}
      <Flex gap={8} wrap>
        {FILTERS.map(({ key, placeholder, options }) => (
          <Select
            key={key}
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            value={filterValues[key]}
            onChange={(values) => setFilter(key, values)}
            placeholder={placeholder}
            options={options.map((v) => ({ value: v, label: equipStatLabel(v) }))}
            className="min-w-36 flex-1"
            popupMatchSelectWidth={false}
          />
        ))}
        {activeFilterCount > 0 && (
          <Button type="link" size="small" className="!px-0" onClick={clearFilters}>
            清空筛选
          </Button>
        )}
      </Flex>

      <span className="text-xs text-black/45 dark:text-white/45">
        {activeFilterCount > 0 || searchQuery ? `匹配 ${total} 件` : `共 ${total} 件`}
      </span>

      {/* 套组分组：默认展开，可折叠；id 供目录锚点跳转 */}
      {groups.length === 0 ? (
        <Empty description="没有匹配的装备" />
      ) : (
        groups.map(({ setName, equips }, index) => (
          <div key={setName} id={`equip-set-${index}`} className="scroll-mt-12">
            <Collapse
              ghost
              size="small"
              className="[&_.ant-collapse-header]:!min-h-0 [&_.ant-collapse-header]:!py-1"
              activeKey={expandedSets[setName] ? [setName] : []}
              onChange={() => toggleSetExpanded(setName)}
              items={[
                {
                  key: setName,
                  label: (
                    <Flex align="center" gap={8}>
                      <span className="text-sm font-medium">{setName}</span>
                      <Badge count={equips.length} color="#d48806" overflowCount={999} />
                    </Flex>
                  ),
                  children: (
                    <div
                      className="grid gap-1.5"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, 200px)' }}
                    >
                      {equips.map((equip) => (
                        <EquipCard key={equip.id} equip={equip} />
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ))
      )}
    </Flex>
  )
})
