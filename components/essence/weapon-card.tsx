'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Card, Checkbox, Flex, Tag, Tooltip, Typography } from 'antd'
import type { Weapon } from '@/types/matrix'
import { weaponStatLabel } from '@/data/stat-labels'
import { RARITY_COLORS, weaponImageSrc } from '@/lib/essence-utils'
import { useEssenceSettingsStore } from '@/stores/useEssenceSettingsStore'
import { useMatrixStore } from '@/stores/useMatrixStore'
import { CheckPill } from '@/components/check-pill'

interface WeaponCardProps {
  weapon: Weapon
  isSelected: boolean
  /** 不传时默认使用全局 toggleWeapon（保证 props 稳定以配合 memo） */
  onToggle?: () => void
}

const STAT_ROWS = [
  { label: '基础', pick: (w: Weapon) => w.primaryStat },
  { label: '附加', pick: (w: Weapon) => w.elementalDamage },
  { label: '技能', pick: (w: Weapon) => w.specialAbility },
] as const

/**
 * 武器卡片：稀有度边框（未选中）/ 稀有度背景（选中）+ Checkbox + 三词条。
 * 右下角"武/基"标记武器、基质拥有状态。
 * memo：点选时只有 isSelected 变化的卡片重渲染。
 */
export const WeaponCard = memo(function WeaponCard({
  weapon,
  isSelected,
  onToggle,
}: WeaponCardProps) {
  const toggleWeapon = useMatrixStore((s) => s.toggleWeapon)
  const handleToggle = onToggle ?? (() => toggleWeapon(weapon.id))

  const weaponOwned = useEssenceSettingsStore((s) => s.weaponOwnership[weapon.id] === true)
  const essenceOwned = useEssenceSettingsStore((s) => s.essenceStatus[weapon.id] === true)
  const setWeaponOwnership = useEssenceSettingsStore((s) => s.setWeaponOwnership)
  const setEssenceStatus = useEssenceSettingsStore((s) => s.setEssenceStatus)

  const imageSrc = weaponImageSrc(weapon.id, weapon.iconId)
  const rarityColor = RARITY_COLORS[weapon.rarity]

  return (
    <Card
      size="small"
      hoverable
      onClick={handleToggle}
      style={{
        borderColor: rarityColor,
        ...(isSelected ? { backgroundColor: `${rarityColor}26` } : {}),
      }}
      className="relative"
    >
      <Checkbox
        checked={isSelected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => handleToggle()}
        className="!absolute left-2 top-2 z-10"
        aria-label={`选择 ${weapon.name}`}
      />
      <Tag
        color={rarityColor}
        className="!absolute right-2 top-2 z-10 !m-0 !border-none !px-1 !text-[10px] !leading-4 !text-white"
      >
        {weapon.rarity}★
      </Tag>

      <Flex vertical align="center" gap={4}>
        <div className="relative aspect-square w-full">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={weapon.name}
              fill
              sizes="120px"
              className="object-contain"
            />
          ) : (
            <Flex
              align="center"
              justify="center"
              className="h-full w-full rounded bg-black/5 text-2xl text-black/30 dark:bg-white/10 dark:text-white/30"
            >
              {weapon.name.slice(0, 1)}
            </Flex>
          )}
        </div>

        <Typography.Text ellipsis className="!text-xs !font-medium" title={weapon.name}>
          {weapon.name}
        </Typography.Text>
        <Tag className="!m-0 !px-1.5 !text-[10px] !leading-4">{weapon.type}</Tag>

        <Flex vertical align="center" gap={0} className="w-full">
          {STAT_ROWS.map(({ label, pick }) => (
            <Tooltip key={label} title={`${label}：${weaponStatLabel(pick(weapon))}`}>
              <Typography.Text
                type="secondary"
                ellipsis
                className="!text-[10px] !leading-4 max-w-full"
              >
                {weaponStatLabel(pick(weapon))}
              </Typography.Text>
            </Tooltip>
          ))}
        </Flex>

        <Flex gap={4} onClick={(e) => e.stopPropagation()} aria-label="拥有标记">
          <Tooltip title={weaponOwned ? '已拥有武器（点击取消）' : '标记拥有武器'}>
            <CheckPill
              small
              checked={weaponOwned}
              onChange={(checked) => setWeaponOwnership(weapon.id, checked)}
            >
              武
            </CheckPill>
          </Tooltip>
          <Tooltip title={essenceOwned ? '已有基质（点击取消）' : '标记已有基质'}>
            <CheckPill
              small
              checked={essenceOwned}
              onChange={(checked) => setEssenceStatus(weapon.id, checked)}
            >
              基
            </CheckPill>
          </Tooltip>
        </Flex>
      </Flex>
    </Card>
  )
})
