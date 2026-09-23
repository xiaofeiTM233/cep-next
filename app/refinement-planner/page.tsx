'use client'

import { useEffect, useState } from 'react'
import { Button, Flex, FloatButton, Layout, Segmented, Splitter, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { AppSider, MobileNav } from '@/components/app-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { EquipList } from '@/components/refinement/equip-list'
import { RefinementPanel } from '@/components/refinement/refinement-panel'
import { useGroupedSets, useRefinementStore } from '@/stores/useRefinementStore'
import { useSplitterSize } from '@/lib/use-splitter-size'

/** 套组目录：点击跳转 + 滚动高亮当前套组。 */
function SetToc({
  container,
  groupNames,
}: {
  container: HTMLDivElement | null
  groupNames: string[]
}) {
  const [active, setActive] = useState(0)

  // 滚动监听：取视口顶部所在套组
  useEffect(() => {
    if (!container) return
    const onScroll = () => {
      let current = 0
      for (let i = 0; i < groupNames.length; i++) {
        const el = document.getElementById(`equip-set-${i}`)
        if (!el) continue
        if (el.getBoundingClientRect().top <= container.getBoundingClientRect().top + 56) {
          current = i
        }
      }
      setActive(current)
    }
    onScroll()
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [container, groupNames])

  const jump = (i: number) => {
    // 瞬间切换，不做平滑滚动
    document
      .getElementById(`equip-set-${i}`)
      ?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  return (
    <Flex
      vertical
      gap={1}
      className="!absolute right-2 top-14 max-h-[calc(100%-4.5rem)] overflow-y-auto rounded-md bg-[var(--background)]/80 p-1 backdrop-blur-sm"
    >
      {groupNames.map((name, i) => (
        <button
          key={name}
          type="button"
          onClick={() => jump(i)}
          className={`max-w-[84px] truncate rounded px-1.5 py-0.5 text-left !text-[11px] leading-4 transition-colors ${
            active === i
              ? 'bg-[#d48806]/15 font-medium text-[#d48806]'
              : 'text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10'
          }`}
        >
          {name}
        </button>
      ))}
    </Flex>
  )
}

export default function RefinementPlannerPage() {
  const { size, onResize, onResizeEnd } = useSplitterSize('refinement', 50)
  const groups = useGroupedSets()
  // 装备列表滚动容器（Anchor 的滚动目标）
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const [mobileView, setMobileView] = useState<'equips' | 'recommend'>('equips')
  const selectedEquipId = useRefinementStore((s) => s.selectedEquipId)
  const hasSelection = selectedEquipId !== null

  return (
    <Layout hasSider className="h-dvh !flex-row">
      <AppSider />

      <Layout className="!flex-col !min-h-0 !flex-1">
        <Layout.Header className="flex items-center">
          <MobileNav />
          <span className="text-base font-semibold">精锻规划</span>
          {hasSelection && (
            <span className="ml-2 text-xs text-black/45 dark:text-white/45">已选择装备</span>
          )}
          <div className="flex-1" />
          <ThemeToggle />
        </Layout.Header>

        <Layout className="!flex-col !min-h-0 !flex-1">
          {/* 桌面：Splitter 可拖拽分栏（位置持久化，左栏可折叠） */}
          <div className="hidden min-h-0 flex-1 md:block">
            <Splitter className="h-full" onResize={onResize} onResizeEnd={onResizeEnd}>
              <Splitter.Panel
                size={size}
                min="25%"
                max="58%"
                collapsible
                className="relative !overflow-hidden"
              >
                <div ref={setScrollEl} className="h-full overflow-y-auto p-3">
                  <EquipList />
                </div>
                {/* 套组目录：快速跳转，滚动时高亮当前套组 */}
                <SetToc container={scrollEl} groupNames={groups.map((g) => g.setName)} />
              </Splitter.Panel>
              <Splitter.Panel className="!overflow-y-auto !p-4">
                <RefinementPanel />
              </Splitter.Panel>
            </Splitter>
          </div>

          {/* 移动端 */}
          <div className="flex min-h-0 flex-1 flex-col md:hidden">
            <div className="px-4 pb-2 pt-3">
              <Segmented
                block
                value={mobileView}
                onChange={(v) => setMobileView(v as 'equips' | 'recommend')}
                options={[
                  { value: 'equips', label: '装备列表' },
                  { value: 'recommend', label: '精锻推荐', disabled: !hasSelection },
                ]}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-16">
              {mobileView === 'equips' ? <EquipList /> : <RefinementPanel />}
            </div>
            <FloatButton
              type="primary"
              tooltip={mobileView === 'equips' ? '查看推荐' : '管理装备'}
              icon={mobileView === 'equips' ? <RightOutlined /> : <LeftOutlined />}
              onClick={() =>
                setMobileView(mobileView === 'equips' ? 'recommend' : 'equips')
              }
              className="!bottom-8 !right-6"
            />
          </div>
        </Layout>
      </Layout>
    </Layout>
  )
}
