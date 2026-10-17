'use client'

import { Button, Popover, Select } from 'antd'
import { CloudServerOutlined } from '@ant-design/icons'
import { ASSET_MIRRORS, type AssetMirrorKey } from '@/lib/asset-mirrors'
import { useMirrorStore } from '@/stores/useMirrorStore'

const MIRROR_OPTIONS = Object.entries(ASSET_MIRRORS).map(([value, { label }]) => ({
  value: value as AssetMirrorKey,
  label,
}))

/** 图标镜像源切换：hover 图标展开 Select（触屏可点击），选择即时生效并持久化。 */
export function MirrorSwitch() {
  const mirror = useMirrorStore((s) => s.mirror)
  const setMirror = useMirrorStore((s) => s.setMirror)

  return (
    <Popover
      trigger={['hover', 'click']}
      placement="bottomRight"
      mouseEnterDelay={0.1}
      content={
        <Select
          value={mirror}
          onChange={(v) => setMirror(v)}
          options={MIRROR_OPTIONS}
          size="small"
          style={{ width: 176 }}
        />
      }
    >
      <Button
        type="text"
        aria-label="切换图标镜像源"
        title={`图标镜像源：${ASSET_MIRRORS[mirror].label}（点击切换）`}
        icon={<CloudServerOutlined />}
      />
    </Popover>
  )
}
