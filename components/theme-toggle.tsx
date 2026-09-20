'use client'

import { Button } from 'antd'
import { MoonFilled, SunFilled } from '@ant-design/icons'
import { useTheme } from '@/lib/theme'

/** 顶栏亮/暗主题切换按钮。 */
export function ThemeToggle() {
  const { mode, toggle } = useTheme()
  return (
    <Button
      type="text"
      aria-label="切换主题"
      title={mode === 'dark' ? '切换到亮色' : '切换到暗色'}
      icon={mode === 'dark' ? <SunFilled /> : <MoonFilled />}
      onClick={toggle}
    />
  )
}
