'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, Drawer, Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  AimOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'

/** 站点导航：桌面侧边栏与移动端抽屉共用同一份配置。 */
const NAV_ITEMS = [
  { href: '/', label: '首页', icon: <HomeOutlined /> },
  { href: '/essence-planner', label: '基质规划', icon: <AimOutlined /> },
  { href: '/refinement-planner', label: '精锻规划', icon: <ThunderboltFilled /> },
]

/** 侧边栏折叠偏好的 localStorage key。 */
const COLLAPSE_KEY = 'cep-sider-collapsed'

/** 按当前路由生成导航菜单项：label 内嵌 Link，路由交给 Next 处理。 */
function useNavItems(onNavigate?: () => void) {
  const pathname = usePathname()

  const items: MenuProps['items'] = NAV_ITEMS.map((item) => ({
    key: item.href,
    icon: item.icon,
    label: (
      <Link href={item.href} onClick={onNavigate}>
        {item.label}
      </Link>
    ),
  }))

  return { items, selectedKeys: [pathname] }
}

/**
 * 桌面端侧边栏导航：可折叠（折叠状态持久化），移动端隐藏。
 * 折叠按钮放在底部自定义，故 trigger 传 null。
 */
export function AppSider() {
  const [collapsed, setCollapsed] = useState(false)
  const { items, selectedKeys } = useNavItems()

  // 挂载后应用折叠偏好（SSR 读不到 localStorage，只能在 effect 里同步外部状态）
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 挂载后读取外部存储的一次性同步
      if (window.localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true)
    } catch {
      /* localStorage 不可用时保持展开 */
    }
  }, [])

  const handleCollapse = useCallback((next: boolean) => {
    setCollapsed(next)
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <Layout.Sider
      theme="light"
      collapsed={collapsed}
      width={168}
      collapsedWidth={56}
      trigger={null}
      className="hidden shrink-0 border-r border-black/10 md:block dark:border-white/10"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center gap-2 px-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#d48806] text-xs font-bold text-white">
            终
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold">终末地规划器</span>
          )}
        </div>

        <Menu
          mode="inline"
          items={items}
          selectedKeys={selectedKeys}
          className="!border-e-0"
        />

        <div className="mt-auto border-t border-black/10 p-2 dark:border-white/10">
          <Button
            type="text"
            block
            aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
            title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => handleCollapse(!collapsed)}
          />
        </div>
      </div>
    </Layout.Sider>
  )
}

/** 移动端导航：顶栏汉堡按钮 + 左侧抽屉，桌面端隐藏。 */
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { items, selectedKeys } = useNavItems(() => setOpen(false))

  return (
    <div className="-ml-2 md:hidden">
      <Button
        type="text"
        aria-label="打开导航菜单"
        icon={<MenuOutlined />}
        onClick={() => setOpen(true)}
      />
      <Drawer
        placement="left"
        size={200}
        open={open}
        onClose={() => setOpen(false)}
        title="终末地规划器"
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          items={items}
          selectedKeys={selectedKeys}
          className="!border-e-0"
        />
      </Drawer>
    </div>
  )
}
