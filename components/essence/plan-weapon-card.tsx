'use client'

import { memo } from 'react'
import Image from 'next/image'
import { CheckCircleFilled } from '@ant-design/icons'
import { Tooltip } from 'antd'
import type { Weapon } from '@/types/matrix'
import { weaponStatLabel } from '@/data/stat-labels'
import { RARITY_COLORS, weaponImageSrc } from '@/lib/essence-utils'
import { useMatrixStore } from '@/stores/useMatrixStore'
import { ItemFrameBackground } from '@/components/shared/item-frame-background'

interface PlanWeaponCardProps {
  weapon: Weapon
  /** 用户是否已选择该武器 */
  isSelected: boolean
  /** 是否在生效的基础属性范围内（范围外降透明度） */
  inRange: boolean
}

/**
 * 方案列表内的武器卡片：游戏图鉴风格——边框底图 + 立绘满铺 +
 * 稀有度底带 + 底部武器名；已选时右上角橙色对勾 + 稀有度色描边。
 * 点击切换选中；词条收进悬停 Tooltip。
 */
export const PlanWeaponCard = memo(function PlanWeaponCard({
  weapon,
  isSelected,
  inRange,
}: PlanWeaponCardProps) {
  const toggleWeapon = useMatrixStore((s) => s.toggleWeapon)

  const imageSrc = weaponImageSrc(weapon.id, weapon.iconId)
  const rarityColor = RARITY_COLORS[weapon.rarity]

  return (
    <Tooltip
      title={
        <div className="text-xs">
          <div className="font-medium">
            {weapon.name}
            <span className="ml-1 font-normal opacity-60">{weapon.type}</span>
          </div>
          <div>基础：{weaponStatLabel(weapon.primaryStat)}</div>
          <div>附加：{weaponStatLabel(weapon.elementalDamage)}</div>
          <div>技能：{weaponStatLabel(weapon.specialAbility)}</div>
        </div>
      }
    >
      <div
        role="checkbox"
        aria-checked={isSelected}
        aria-label={`${isSelected ? '取消选择' : '选择'}${weapon.name}`}
        tabIndex={0}
        onClick={() => toggleWeapon(weapon.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleWeapon(weapon.id)
          }
        }}
        className={`relative isolate aspect-square w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border outline-none transition-all ${
          isSelected ? 'border-transparent' : 'border-black/10 dark:border-white/10'
        }`}
        style={{
          opacity: inRange ? 1 : 0.35,
          ...(isSelected
            ? {
                borderColor: rarityColor,
                boxShadow: `0 0 8px ${rarityColor}55`,
              }
            : {}),
        }}
      >
        <ItemFrameBackground />

        {/* 已选角标 */}
        {isSelected && (
          <CheckCircleFilled
            className="!absolute right-1 top-1 z-30 text-[14px]"
            style={{ color: '#faad14' }}
          />
        )}

        {/* 武器立绘 */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {imageSrc ? (
            <Image src={imageSrc} alt={weapon.name} fill sizes="64px" className="object-cover" />
          ) : (
            <span className="select-none text-lg font-bold text-white/50">
              {weapon.name.slice(0, 1)}
            </span>
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

        {/* 底部武器名 */}
        <div className="absolute bottom-1 left-0 right-0 z-30 px-1 text-center">
          <p className="truncate text-[11px] font-semibold leading-tight text-stone-100 drop-shadow-md" title={weapon.name}>
            {weapon.name}
          </p>
        </div>
      </div>
    </Tooltip>
  )
})
