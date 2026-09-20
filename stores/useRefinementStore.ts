import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Equip, SlotRecommendation } from '@/types/refinement'
import { equips, equipById, setNames } from '@/data/equips'
import { MATERIAL_ICON_IDS } from '@/data/material-images'
import { buildRecommendations } from '@/lib/refinement/solver'
import { sanitizeId } from '@/lib/persist-sanitizer'

/**
 * 精锻规划会话状态：选择装备 → 三槽位精锻推荐。
 * 仅选择/折叠/筛选等用户偏好持久化，派生数据不入存储。
 */

interface RefinementState {
  // Selection
  selectedEquipId: string | null

  // Search
  searchQuery: string

  // Left-side attribute filters (by stat key)
  filterSub1: string[]
  filterSub2: string[]
  filterSpecial: string[]

  // Filter panel collapsed
  filterCollapsed: boolean

  // Right-side material filter
  // 全局制造工艺：选中的原件中文名（null = 各装备默认工艺）
  craftMaterial: string | null

  // 套组展开状态（默认全部展开）
  expandedSets: Record<string, boolean>

  // Actions
  selectEquip: (id: string | null) => void
  toggleSetExpanded: (setName: string) => void
  setCraftMaterial: (name: string | null) => void
  setSearchQuery: (q: string) => void
  toggleFilter: (group: 'sub1' | 'sub2' | 'special', value: string) => void
  setFilter: (group: 'sub1' | 'sub2' | 'special', values: string[]) => void
  clearFilters: () => void
  toggleFilterCollapsed: () => void
}

function filterKeyOf(group: 'sub1' | 'sub2' | 'special') {
  return group === 'sub1'
    ? 'filterSub1'
    : group === 'sub2'
      ? 'filterSub2'
      : group === 'special'
        ? 'filterSpecial'
        : 'filterSpecial'
}

function isValidEquipId(id: string): boolean {
  return equipById.has(id)
}

export const useRefinementStore = create<RefinementState>()(
  persist(
    (set, get) => ({
      selectedEquipId: null,
      searchQuery: '',
      filterSub1: [],
      filterSub2: [],
      filterSpecial: [],
      filterCollapsed: true,
          craftMaterial: null,
      expandedSets: Object.fromEntries(setNames.map((n) => [n, true])),

      selectEquip: (id) => {
        // Deselect if same equip clicked
        if (id === get().selectedEquipId) {
          set({ selectedEquipId: null })
          return
        }
        set({ selectedEquipId: id })
      },

      setCraftMaterial: (name) => set({ craftMaterial: name }),

      toggleSetExpanded: (setName) => {
        set((s) => ({
          expandedSets: { ...s.expandedSets, [setName]: !s.expandedSets[setName] },
        }))
      },

      setSearchQuery: (q) => set({ searchQuery: q }),

      toggleFilter: (group, value) => {
        set((s) => {
          const key = filterKeyOf(group)
          const list = s[key] as string[]
          const next = list.includes(value)
            ? list.filter((v) => v !== value)
            : [...list, value]
          return { [key]: next } as Partial<RefinementState>
        })
      },

      setFilter: (group, values) => {
        set({ [filterKeyOf(group)]: values } as Partial<RefinementState>)
      },

      clearFilters: () => set({ filterSub1: [], filterSub2: [], filterSpecial: [] }),

      toggleFilterCollapsed: () => set((s) => ({ filterCollapsed: !s.filterCollapsed })),
    }),
    {
      name: 'refinement-session',
      partialize: (s) => ({
        selectedEquipId: s.selectedEquipId,
        filterCollapsed: s.filterCollapsed,
        craftMaterial: s.craftMaterial,
        expandedSets: s.expandedSets,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        const result = { ...current }
        result.selectedEquipId = sanitizeId(p.selectedEquipId, isValidEquipId)
        result.filterCollapsed =
          typeof p.filterCollapsed === 'boolean' ? p.filterCollapsed : true
        if (typeof p.craftMaterial === 'string' && p.craftMaterial in MATERIAL_ICON_IDS) {
          result.craftMaterial = p.craftMaterial
        }
        // 重建 expandedSets：以当前套组名为准，缺失回退展开
        const persistedExpanded = p.expandedSets as Record<string, unknown> | undefined
        const mergedExpanded: Record<string, boolean> = {}
        for (const name of setNames) {
          mergedExpanded[name] =
            typeof persistedExpanded?.[name] === 'boolean'
              ? persistedExpanded[name]
              : true
        }
        result.expandedSets = mergedExpanded
        return result
      },
    },
  ),
)

// ─── Derived selectors ──────────────────────────────────────────────────────

/** Get the selected equip, or null */
export function useSelectedEquip(): Equip | null {
  const id = useRefinementStore((s) => s.selectedEquipId)
  if (!id) return null
  return equipById.get(id) ?? null
}

function matchesEquipQuery(equip: Pick<Equip, 'name' | 'type' | 'setName'>, query: string): boolean {
  const term = query.trim().toLowerCase()
  if (!term) return true
  return [equip.name, equip.type, equip.setName].some((value) =>
    value.toLowerCase().includes(term),
  )
}

/** Get filtered and searched equip list */
export function useFilteredEquips(): Equip[] {
  const query = useRefinementStore((s) => s.searchQuery)
  const sub1 = useRefinementStore((s) => s.filterSub1)
  const sub2 = useRefinementStore((s) => s.filterSub2)
  const special = useRefinementStore((s) => s.filterSpecial)

  if (!query && sub1.length === 0 && sub2.length === 0 && special.length === 0) {
    return equips
  }

  return equips.filter((e) => {
    if (query && !matchesEquipQuery(e, query)) return false
    if (sub1.length > 0 && (!e.sub1 || !sub1.includes(e.sub1.key))) return false
    if (sub2.length > 0 && (!e.sub2 || !sub2.includes(e.sub2.key))) return false
    if (special.length > 0 && (!e.special || !special.includes(e.special.key))) return false
    return true
  })
}

/** Get equips grouped by set (respects filters and search) */
export function useGroupedSets(): { setName: string; equips: Equip[] }[] {
  const filtered = useFilteredEquips()
  const groups: { setName: string; equips: Equip[] }[] = []

  // Preserve set order from the original setNames list
  for (const setName of setNames) {
    const setEquips = filtered.filter((e) => e.setName === setName)
    if (setEquips.length > 0) {
      groups.push({ setName, equips: setEquips })
    }
  }

  return groups
}

/** Get recommendations for the selected equip */
export function useRecommendations(): SlotRecommendation[] {
  const selected = useSelectedEquip()
  if (!selected) return []
  return buildRecommendations(selected, [])
}
