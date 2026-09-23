'use client'

import { App, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import { useTheme } from '@/lib/theme'

/** antd 全局配置：中文语言包 + 亮/暗算法 + 主题 token。 */
export function AntdProviders({ children }: { children: ReactNode }) {
  const { mode } = useTheme()
  const dark = mode === 'dark'

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#d48806',
          borderRadius: 8,
        },
        components: {
          // 顶栏走 antd 默认样式：背景与侧边栏同为容器色（colorBgContainer），随亮暗算法切换
          Layout: {
            headerBg: dark ? '#141414' : '#ffffff',
            headerPadding: '0 16px',
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
