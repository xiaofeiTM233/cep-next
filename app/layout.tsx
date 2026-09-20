import type { Metadata, Viewport } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { AntdProviders } from '@/lib/antd-providers'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '终末地规划器',
    template: '%s | 终末地规划器',
  },
  description:
    '《明日方舟：终末地》规划工具集——基质规划与计算、精锻规划与计算。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * 首屏主题兜底：在样式表加载前根据 localStorage 设置 data-theme，
 * 暗色用户 hydrate 前由 CSS 变量控制背景色，避免闪白。
 */
const themeInitScript = `(function(){try{var m=localStorage.getItem('cep-theme');if(m==='dark'){document.documentElement.dataset.theme='dark';}}catch(e){}})();`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <AntdProviders>{children}</AntdProviders>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
