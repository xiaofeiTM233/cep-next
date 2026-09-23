'use client'

import { memo } from 'react'
import Image from 'next/image'
import { CheckCircleFilled } from '@ant-design/icons'
import { Flex, Tooltip } from 'antd'
import type { Weapon } from '@/types/matrix'
import { weaponStatLabel } from '@/data/stat-labels'
import { RARITY_COLORS, weaponImageSrc } from '@/lib/essence-utils'
import { useEssenceSettingsStore } from '@/stores/useEssenceSettingsStore'
import { useMatrixStore } from '@/stores/useMatrixStore'
import { CheckPill } from '@/components/check-pill'
import { ItemFrameBackground } from '@/components/shared/item-frame-background'

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
 * 武器卡片：参考游戏图鉴布局——正方形暗底卡片，立绘铺满整卡，
 * 武器名叠加在底部渐变遮罩上，三词条收进悬停 Tooltip。
 * 选中时稀有度色描边发光 + 右上角橙色圆形对勾；左上角"武/基"拥有标记。
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

  const statTooltip = (
    <div>
      <div>{weapon.type}</div>
      {STAT_ROWS.map(({ label, pick }) => (
        <div key={label}>{`${label}：${weaponStatLabel(pick(weapon))}`}</div>
      ))}
    </div>
  )

  return (
    <Tooltip title={statTooltip}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`选择 ${weapon.name}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        className={`relative isolate aspect-square cursor-pointer overflow-hidden rounded-lg border border-black/10 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/10 dark:focus-visible:ring-white/40 ${
          isSelected ? 'weapon-card-selected' : ''
        }`}
        style={
          isSelected
            ? { borderColor: rarityColor, boxShadow: `0 0 10px ${rarityColor}66, inset 0 0 6px ${rarityColor}33` }
            : undefined
        }
      >
        <ItemFrameBackground />

        {/* 选中角标 */}
        {isSelected && (
          <CheckCircleFilled
            className="!absolute right-1.5 top-1.5 z-20 text-[18px]"
            style={{ color: '#faad14' }}
          />
        )}

        {/* 武/基拥有标记 */}
        <Flex
          gap={2}
          className="!absolute left-1.5 top-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
          aria-label="拥有标记"
        >
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

        {/* 武器立绘：铺满整卡 */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={weapon.name}
              fill
              sizes="160px"
              className="object-cover"
            />
          ) : (
            <span className="select-none text-2xl font-bold text-white/50">{weapon.name.slice(0, 1)}</span>
          )}
        </div>

        {/* 稀有度底带 */}
        <Image
          src={`/images/item-band-${weapon.rarity}.png`}
          alt=""
          width={200}
          height={40}
          className="pointer-events-none absolute -inset-x-px bottom-0 z-20 h-auto w-[calc(100%+2px)] max-w-none object-cover object-bottom"
          unoptimized
        />

        {/* 底部武器名（样式抄自原项目） */}
        <div className="absolute bottom-1.5 left-0 right-0 z-30 px-2 text-center">
          <p className="truncate text-sm font-semibold leading-tight text-stone-100 drop-shadow-md" title={weapon.name}>
            {weapon.name}
          </p>
        </div>
      </div>
    </Tooltip>
  )
})
