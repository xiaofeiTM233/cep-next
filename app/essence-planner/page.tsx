'use client'

import { useEffect, useState } from 'react'
import { Button, FloatButton, Layout, Segmented, Splitter, Tooltip } from 'antd'
import {
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { AppSider, MobileNav } from '@/components/app-nav'
import { WeaponGrid } from '@/components/essence/weapon-grid'
import { PlanList } from '@/components/essence/plan-list'
import { EssenceSettingsDrawer } from '@/components/essence/essence-settings-drawer'
import { CustomWeaponModal } from '@/components/essence/custom-weapon-modal'
import { ThemeToggle } from '@/components/theme-toggle'
import { useMatrixStore } from '@/stores/useMatrixStore'
import { useSplitterSize } from '@/lib/use-splitter-size'

export default function EssencePlannerPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [mobileView, setMobileView] = useState<'weapons' | 'plans'>('weapons')

  const selectedCount = useMatrixStore((s) => s.selectedWeaponIds.length)
  const planOrderLength = useMatrixStore((s) => s.planOrder.length)
  const plansStale = useMatrixStore((s) => s.plansStale)
  const computePlans = useMatrixStore((s) => s.computePlans)

  // 兜底：persist 异步恢复与首帧渲染之间的间隙里，选中武器但方案缺失时补算
  useEffect(() => {
    if (selectedCount > 0 && planOrderLength === 0 && !plansStale) {
      computePlans()
    }
  }, [selectedCount, planOrderLength, plansStale, computePlans])

  const noWeaponsSelected = selectedCount === 0

  return (
    <Layout hasSider className="h-dvh !flex-row">
      <AppSider />

      <Layout className="!flex-col !min-h-0 !flex-1">
        <Layout.Header className="flex items-center">
          <MobileNav />
          <span className="text-base font-semibold">基质规划</span>
          <div className="flex-1" />
          <Tooltip title="自定义武器">
            <Button
              type="text"
              icon={<PlusOutlined />}
              aria-label="自定义武器"
              onClick={() => setCustomOpen(true)}
            />
          </Tooltip>
          <Tooltip title="基质规划设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              aria-label="基质规划设置"
              onClick={() => setSettingsOpen(true)}
            />
          </Tooltip>
          <ThemeToggle />
        </Layout.Header>

        <Layout className="!flex-col !min-h-0 !flex-1">
          {/* 桌面：Splitter 可拖拽分栏（左栏可折叠） */}
          <SplitterPane />
          {/* 移动端：Segmented 切换 + FloatButton 跳转 */}
          <MobilePane
            mobileView={mobileView}
            setMobileView={setMobileView}
            noWeaponsSelected={noWeaponsSelected}
            selectedCount={selectedCount}
          />
        </Layout>
      </Layout>

      <EssenceSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CustomWeaponModal open={customOpen} onClose={() => setCustomOpen(false)} />
    </Layout>
  )
}

/** 桌面双栏：左武器选择 / 右方案列表，Splitter 可拖拽（位置持久化）、左栏可折叠。 */
function SplitterPane() {
  const { size, onResize, onResizeEnd } = useSplitterSize('essence', 38)
  return (
    <div className="hidden min-h-0 flex-1 md:block">
      <Splitter className="h-full" onResize={onResize} onResizeEnd={onResizeEnd}>
        <Splitter.Panel
          size={size}
          min="22%"
          max="55%"
          collapsible
          className="!overflow-y-auto !p-3"
        >
          <WeaponGrid />
        </Splitter.Panel>
        <Splitter.Panel className="!overflow-y-auto !p-4">
          <PlanList />
        </Splitter.Panel>
      </Splitter>
    </div>
  )
}

function MobilePane({
  mobileView,
  setMobileView,
  noWeaponsSelected,
  selectedCount,
}: {
  mobileView: 'weapons' | 'plans'
  setMobileView: (v: 'weapons' | 'plans') => void
  noWeaponsSelected: boolean
  selectedCount: number
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col md:hidden">
      <div className="px-4 pb-2 pt-3">
        <Segmented
          block
          value={mobileView}
          onChange={(v) => setMobileView(v as 'weapons' | 'plans')}
          options={[
            { value: 'weapons', label: '武器选择' },
            { value: 'plans', label: '方案推荐' },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-16">
        {mobileView === 'weapons' ? <WeaponGrid /> : <PlanList />}
      </div>
      <FloatButton
        type="primary"
        badge={{ count: selectedCount, color: '#d48806', overflowCount: 999 }}
        tooltip={mobileView === 'weapons' ? '查看方案' : '选择武器'}
        icon={mobileView === 'weapons' ? <RightOutlined /> : <LeftOutlined />}
        onClick={() => {
          if (mobileView === 'weapons') {
            if (!noWeaponsSelected) setMobileView('plans')
          } else {
            setMobileView('weapons')
          }
        }}
        className="!bottom-8 !right-6"
      />
    </div>
  )
}
