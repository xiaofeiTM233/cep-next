'use client'

import { App, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import { useTheme } from '@/lib/theme'

/** antd 全局配置：中文语言包 + 亮/暗算法 + 主题 token。 */
export function AntdProviders({ children }: { children: ReactNode }) {
  const { mode } = useTheme()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#d48806',
          borderRadius: 8,
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
