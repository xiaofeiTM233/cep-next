'use client'

import { useMemo, useState } from 'react'
import { App, Button, Form, Input, List, Modal, Popconfirm, Select, Space } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Weapon } from '@/types/matrix'
import { weaponStatLabel } from '@/data/stat-labels'
import { useEssenceSettingsStore, WEAPON_TYPES, type CustomWeapon } from '@/stores/useEssenceSettingsStore'
import { ELEMENTAL_STAT_OPTIONS, PRIMARY_STAT_OPTIONS, SPECIAL_STAT_OPTIONS } from '@/lib/essence-utils'

interface CustomWeaponModalProps {
  open: boolean
  onClose: () => void
}

const ANY_VALUE = '__any__'

const STAT_OPTIONS = {
  primaryStat: PRIMARY_STAT_OPTIONS,
  elementalDamage: ELEMENTAL_STAT_OPTIONS,
  specialAbility: SPECIAL_STAT_OPTIONS,
} as const

type StatSlot = keyof typeof STAT_OPTIONS

const SLOT_LABELS: Record<StatSlot, string> = {
  primaryStat: '基础属性',
  elementalDamage: '附加属性',
  specialAbility: '技能属性',
}

interface CustomWeaponFormValues {
  name: string
  rarity: Weapon['rarity']
  type: string
  primaryStat: string
  elementalDamage: string
  specialAbility: string
}

/** 自定义武器管理弹窗：列表 + 新建/编辑表单。 */
export function CustomWeaponModal({ open, onClose }: CustomWeaponModalProps) {
  const { message } = App.useApp()
  const customWeapons = useEssenceSettingsStore((s) => s.customWeapons)
  const addCustomWeapon = useEssenceSettingsStore((s) => s.addCustomWeapon)
  const updateCustomWeapon = useEssenceSettingsStore((s) => s.updateCustomWeapon)
  const removeCustomWeapon = useEssenceSettingsStore((s) => s.removeCustomWeapon)

  const [editing, setEditing] = useState<CustomWeapon | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form] = Form.useForm<CustomWeaponFormValues>()

  const statOptions = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(STAT_OPTIONS) as StatSlot[]).map((slot) => [
          slot,
          [{ value: ANY_VALUE, label: '任意' }, ...STAT_OPTIONS[slot].map((v) => ({ value: v, label: weaponStatLabel(v) }))],
        ]),
      ),
    [],
  )

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ rarity: 5, type: '单手剑' })
    setFormOpen(true)
  }

  const openEdit = (weapon: CustomWeapon) => {
    setEditing(weapon)
    form.resetFields()
    form.setFieldsValue({
      name: weapon.name,
      rarity: weapon.rarity,
      type: weapon.type,
      primaryStat: weapon.primaryStat ?? ANY_VALUE,
      elementalDamage: weapon.elementalDamage ?? ANY_VALUE,
      specialAbility: weapon.specialAbility ?? ANY_VALUE,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const weapon: CustomWeapon = {
      id: editing?.id ?? `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: values.name.trim(),
      rarity: values.rarity,
      type: values.type,
      primaryStat: orNull(values.primaryStat),
      elementalDamage: orNull(values.elementalDamage),
      specialAbility: orNull(values.specialAbility),
      chars: [],
    }
    if (editing) {
      updateCustomWeapon(weapon)
      message.success('已保存修改')
    } else {
      addCustomWeapon(weapon)
      message.success('已添加自定义武器')
    }
    setFormOpen(false)
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} title="自定义武器" width={520}>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="!mb-3">
        添加武器
      </Button>

      {customWeapons.length === 0 ? (
        <div className="py-8 text-center text-sm text-black/45 dark:text-white/45">
          暂无自定义武器
        </div>
      ) : (
        <List
          size="small"
          dataSource={customWeapons}
          renderItem={(weapon) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(weapon)}
                  aria-label="编辑"
                />,
                <Popconfirm
                  key="delete"
                  title="删除该自定义武器？"
                  onConfirm={() => {
                    removeCustomWeapon(weapon.id)
                    message.success('已删除')
                  }}
                >
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="删除" />
                </Popconfirm>,
              ]}
            >
              <Space size={6} wrap>
                <span className="font-medium">{weapon.name}</span>
                <span className="text-xs text-black/45 dark:text-white/45">
                  {weapon.rarity}星 · {weapon.type}
                </span>
                <span className="text-xs text-black/65 dark:text-white/65">
                  {weaponStatLabel(weapon.primaryStat)} / {weaponStatLabel(weapon.elementalDamage)} /{' '}
                  {weaponStatLabel(weapon.specialAbility)}
                </span>
              </Space>
            </List.Item>
          )}
        />
      )}

      <Modal
        open={formOpen}
        title={editing ? '编辑武器' : '添加武器'}
        okText="保存"
        cancelText="取消"
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        destroyOnHidden
        width={440}
      >
        <Form form={form} layout="vertical" className="!mt-4">
          <Form.Item name="name" label="武器名称" rules={[{ required: true, message: '请输入武器名称' }]}>
            <Input placeholder="输入武器名称" maxLength={20} />
          </Form.Item>
          <Space size="middle" className="flex">
            <Form.Item name="rarity" label="稀有度" className="!mb-0 w-28">
              <Select options={[3, 4, 5, 6].map((v) => ({ value: v, label: `${v}星` }))} />
            </Form.Item>
            <Form.Item name="type" label="武器类型" className="!mb-0 w-36">
              <Select options={WEAPON_TYPES.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Space>
          {(Object.keys(SLOT_LABELS) as StatSlot[]).map((slot) => (
            <Form.Item key={slot} name={slot} label={SLOT_LABELS[slot]} className="!mb-3 !mt-3">
              <Select options={statOptions[slot]} />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Modal>
  )
}

function orNull(value: string): string | null {
  return value === ANY_VALUE ? null : value
}
