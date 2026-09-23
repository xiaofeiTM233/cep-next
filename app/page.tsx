'use client'

import Link from 'next/link'
import { Card, Layout, Typography } from 'antd'
import {
  AimOutlined,
  MoonFilled,
  RightOutlined,
  SunFilled,
  ThunderboltFilled,
} from '@ant-design/icons'
import { AppSider, MobileNav } from '@/components/app-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/lib/theme'

const FEATURES = [
  {
    href: '/essence-planner',
    icon: <AimOutlined />,
    title: '基质规划',
    description:
      '多武器基质刷取优化：勾选需要培养的武器，按副本与词条锁定生成刷取方案，支持地区优先级、拥有标记与自定义武器。',
    accent: '#d48806',
  },
  {
    href: '/refinement-planner',
    icon: <ThunderboltFilled />,
    title: '精锻规划',
    description:
      '装备精锻方案计算：按套组浏览 5 星装备三槽位属性，查找最优精锻装备与所有较好适配装备，支持材料筛选。',
    accent: '#5b8ff9',
  },
] as const

export default function Home() {
  return (
    <Layout hasSider className="h-dvh !flex-row">
      <AppSider />

      <Layout className="!flex-col !min-h-0 !flex-1">
        <Layout.Header className="flex items-center">
          <MobileNav />
          <span className="text-base font-semibold tracking-tight">首页</span>
          <div className="flex-1" />
          <ThemeToggle />
        </Layout.Header>

        <Layout.Content className="!flex-1 overflow-y-auto">
          <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10">
            <div className="text-center">
              <Typography.Title level={2} className="!mb-2">
                《明日方舟：终末地》规划工具集
              </Typography.Title>
              <Typography.Paragraph type="secondary">
                基质规划与计算、精锻规划与计算——数据本地保存，即开即用。
              </Typography.Paragraph>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <Link key={feature.href} href={feature.href} className="group block">
                  <Card
                    hoverable
                    className="h-full transition-shadow group-hover:shadow-lg"
                    styles={{
                      body: { display: 'flex', flexDirection: 'column', gap: 8, height: '100%' },
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg text-white"
                        style={{ backgroundColor: feature.accent }}
                      >
                        {feature.icon}
                      </span>
                      <span className="text-base font-semibold">{feature.title}</span>
                      <RightOutlined className="ml-auto text-xs text-black/30 transition-transform group-hover:translate-x-0.5 dark:text-white/30" />
                    </div>
                    <Typography.Paragraph type="secondary" className="!mb-0 text-sm">
                      {feature.description}
                    </Typography.Paragraph>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center text-xs text-black/35 dark:text-white/35">
              <ThemeHint />
            </div>
          </main>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

function ThemeHint() {
  const { mode } = useTheme()
  return (
    <span className="inline-flex items-center gap-1">
      {mode === 'dark' ? <MoonFilled /> : <SunFilled />}
      支持亮 / 暗主题（右上角切换），偏好自动记住
    </span>
  )
}
