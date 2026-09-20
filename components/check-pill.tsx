'use client'

import { Tag } from 'antd'
import type { ReactNode } from 'react'

const UNCHECKED =
  '!m-0 !rounded-md !border !border-black/15 !bg-black/[0.03] !px-2 !text-xs !leading-5 hover:!border-[#d48806] dark:!border-white/20 dark:!bg-white/[0.05]'

const CHECKED =
  '!m-0 !rounded-md !border !border-[#d48806] !bg-[#d48806]/15 !px-2 !text-xs !leading-5 !text-[#d48806]'

const UNCHECKED_SM =
  '!m-0 !rounded !border !border-black/15 !bg-black/[0.03] !px-1.5 !text-[11px] !leading-4 hover:!border-[#d48806] dark:!border-white/20 dark:!bg-white/[0.05]'

const CHECKED_SM =
  '!m-0 !rounded !border !border-[#d48806] !bg-[#d48806]/15 !px-1.5 !text-[11px] !leading-4 !text-[#d48806]'

interface CheckPillProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  /** 紧凑版（用于表格/卡片内的标记） */
  small?: boolean
}

/**
 * 可勾选胶囊 Tag：未选中时也带边框和底色，可点击区域明确。
 * 用于地区筛选、S1 锁定、武/基拥有标记等。
 */
export function CheckPill({ checked, onChange, children, small = false }: CheckPillProps) {
  const pill = small
    ? checked
      ? CHECKED_SM
      : UNCHECKED_SM
    : checked
      ? CHECKED
      : UNCHECKED
  return (
    <Tag.CheckableTag checked={checked} onChange={onChange} className={pill}>
      {children}
    </Tag.CheckableTag>
  )
}
