import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEssenceSettingsStore, CUSTOM_WEAPON_PREFIX } from '@/stores/useEssenceSettingsStore'
import { weapons } from '@/data/weapons'
import { dungeons } from '@/data/dungeons'
import { solve, type DungeonPlan } from '@/lib/planner/essence-solver'
import { sanitizeIdArray, sanitizeIdArrayRecord } from '@/lib/persist-sanitizer'

/**
 * 基质规划会话状态：选中武器 → 副本方案。
 * 方案计算用 rAF 合帧（快速连点只算一次），并复用未变化的方案对象引用
 * 以便方案卡片 memo 跳过无效重渲染。
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a Set of weapon IDs to a sorted, stable array. */
function toSortedArray(set: Set<string>): string[] {
  return Array.from(set).sort()
}

/** Stable plan key: dungeon.id + lockType + lockValue. */
export function getPlanKey(plan: DungeonPlan): string {
  return `${plan.dungeon.id}-${plan.lockType}-${plan.lockValue}`
}

/** id 是否对应一把可用武器（内置 或 活跃自定义）。 */
export function isValidWeaponId(id: string): boolean {
  if (staticWeaponIds.has(id)) return true
  if (!id.startsWith(CUSTOM_WEAPON_PREFIX)) return false
  return useEssenceSettingsStore.getState().customWeapons.some((w) => w.id === id)
}

const staticWeaponIds = new Set(weapons.map((w) => w.id))

/**
 * Value comparison of two DungeonPlans — same weapons, same selectedCount,
 * same order, same effective s1. Used to reuse previous plan object
 * references and skip DungeonCard re-renders (React.memo + stable ref).
 */
function isSamePlan(a: DungeonPlan, b: DungeonPlan): boolean {
  if (a.selectedCount !== b.selectedCount) return false
  if (a.totalCount !== b.totalCount) return false
  if (a.needsS1Choice !== b.needsS1Choice) return false
  if (a.matchedWeapons.length !== b.matchedWeapons.length) return false

  for (let i = 0; i < a.matchedWeapons.length; i++) {
    const am = a.matchedWeapons[i]
    const bm = b.matchedWeapons[i]
    if (am.weapon.id !== bm.weapon.id) return false
    if (am.isSelected !== bm.isSelected) return false
  }

  if (a.selectedS1.length !== b.selectedS1.length) return false
  for (let i = 0; i < a.selectedS1.length; i++) {
    if (a.selectedS1[i] !== b.selectedS1[i]) return false
  }

  if (a.s1Candidates.length !== b.s1Candidates.length) return false
  for (let i = 0; i < a.s1Candidates.length; i++) {
    if (a.s1Candidates[i] !== b.s1Candidates[i]) return false
  }

  const aKeys = Object.keys(a.s1CandidateCounts)
  const bKeys = Object.keys(b.s1CandidateCounts)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (a.s1CandidateCounts[key] !== b.s1CandidateCounts[key]) return false
  }

  return true
}

/** Build a reference-stable plan map from the solver output. */
function buildPlanMap(
  newPlans: DungeonPlan[],
  prevMap: Record<string, DungeonPlan>,
): { plansMap: Record<string, DungeonPlan>; planOrder: string[] } {
  const plansMap: Record<string, DungeonPlan> = {}
  const planOrder: string[] = []

  for (const plan of newPlans) {
    const key = getPlanKey(plan)
    planOrder.push(key)
    const prev = prevMap[key]
    plansMap[key] = prev && isSamePlan(prev, plan) ? prev : plan
  }

  return { plansMap, planOrder }
}

/** Compute dungeon plans for a given weapon selection. */
export function getPlansForSelection(ids: Set<string>): DungeonPlan[] {
  if (ids.size === 0) return []
  const customWeapons = useEssenceSettingsStore.getState().customWeapons
  const allWeapons = [...weapons, ...customWeapons]
  // Drop IDs that no longer map to any weapon (e.g. deleted custom weapons).
  const validIds = new Set(allWeapons.map((w) => w.id))
  const cleanIds = new Set([...ids].filter((id) => validIds.has(id)))
  if (cleanIds.size === 0) return []
  const allPlans = solve(cleanIds, allWeapons, dungeons).dungeonPlans
  return allPlans.filter((p) => p.selectedCount > 0)
}

// ─── rAF-coalesced plan computation ─────────────────────────────────────────

let plansPending = false
let rafId: number | undefined

/**
 * Schedule a plan recomputation on the next animation frame.
 * Repeated calls within the same frame coalesce into a single
 * computation using the latest selectedWeaponIds.
 */
function schedulePlansUpdate(
  set: (partial: Partial<MatrixState>) => void,
  get: () => MatrixState,
) {
  if (plansPending) return
  plansPending = true
  rafId = requestAnimationFrame(() => {
    plansPending = false
    rafId = undefined
    const ids = new Set(get().selectedWeaponIds)
    if (ids.size === 0) {
      set({ plansMap: {}, planOrder: [], plansStale: false })
      return
    }
    const newPlans = getPlansForSelection(ids)
    const { plansMap, planOrder } = buildPlanMap(newPlans, get().plansMap)
    set({ plansMap, planOrder, plansStale: false })
  })
}

/** Cancel any pending rAF plan computation. */
function cancelPlansUpdate() {
  plansPending = false
  if (rafId !== undefined) {
    cancelAnimationFrame(rafId)
    rafId = undefined
  }
}

interface MatrixState {
  /** Sorted array of selected weapon ids. */
  selectedWeaponIds: string[]
  /** Plans keyed by stable planKey — updated asynchronously (rAF). */
  plansMap: Record<string, DungeonPlan>
  /** Sorted planKey order for deterministic rendering. */
  planOrder: string[]
  /** True while an rAF plan recomputation is pending. */
  plansStale: boolean
  /** 用户手动收起的方案 key；默认全部展开 */
  collapsedPlanKeys: string[]
  dungeonS1Selections: Record<string, string[]>
  /** Region filter — selected region names (array for JSON serialization). */
  selectedRegions: string[]
  /** Region filter — selected sub-region names. */
  selectedSubRegions: string[]
  /** Shared weapon search query. */
  weaponSearchQuery: string
  /** Shared weapon attr filters (serializable Record<string, string[]>). */
  weaponAttrFilters: Record<string, string[]>
  /** Current visible weapon IDs (written by WeaponGrid, read by select-all). */
  visibleWeaponIds: string[]

  toggleWeapon: (weaponId: string) => void
  selectAllWeapons: (ids?: string[]) => void
  clearWeapons: () => void
  /** Collapse 受控：整体替换手动收起的方案 key 列表（未列出的默认展开） */
  setCollapsedPlanKeys: (keys: string[]) => void
  setDungeonS1Selection: (planKey: string, s1: string[]) => void
  setSelectedRegions: (regions: string[]) => void
  setSelectedSubRegions: (subs: string[]) => void
  setWeaponSearchQuery: (q: string) => void
  setWeaponAttrFilters: (filters: Record<string, string[]>) => void
  setVisibleWeaponIds: (ids: string[]) => void
  /** Synchronously recompute plans (used on rehydration / fallback). */
  computePlans: () => void
}

export const useMatrixStore = create<MatrixState>()(
  persist(
    (set, get) => ({
      selectedWeaponIds: [],
      plansMap: {},
      planOrder: [],
      plansStale: false,
      collapsedPlanKeys: [],
      dungeonS1Selections: {},
      selectedRegions: [],
      selectedSubRegions: [],
      weaponSearchQuery: '',
      weaponAttrFilters: {},
      visibleWeaponIds: [],

      toggleWeapon: (weaponId: string) => {
        const current = get().selectedWeaponIds
        const nextSet = new Set(current)
        if (nextSet.has(weaponId)) {
          nextSet.delete(weaponId)
        } else {
          nextSet.add(weaponId)
        }
        const next = toSortedArray(nextSet)
        if (next.length === current.length && next.every((id, i) => id === current[i])) {
          return
        }
        // 1. Immediately show selection highlight on weapon cards
        // 2. Defer plan computation to next rAF (coalesces rapid clicks)
        set({ selectedWeaponIds: next, plansStale: true })
        schedulePlansUpdate(set, get)
      },

      selectAllWeapons: (ids?: string[]) => {
        const next = ids
          ? toSortedArray(new Set(ids))
          : toSortedArray(new Set(weapons.map((w) => w.id)))
        if (next.length === 0) return
        set({ selectedWeaponIds: next, plansStale: true })
        schedulePlansUpdate(set, get)
      },

      clearWeapons: () => {
        if (get().selectedWeaponIds.length === 0) return
        cancelPlansUpdate()
        set({ selectedWeaponIds: [], plansMap: {}, planOrder: [], plansStale: false })
      },

      setCollapsedPlanKeys: (keys: string[]) => {
        set({ collapsedPlanKeys: Array.from(new Set(keys)) })
      },

      setDungeonS1Selection: (planKey: string, s1: string[]) => {
        set((state) => ({
          dungeonS1Selections: { ...state.dungeonS1Selections, [planKey]: s1 },
        }))
      },

      setSelectedRegions: (regions: string[]) => set({ selectedRegions: regions }),
      setSelectedSubRegions: (subs: string[]) => set({ selectedSubRegions: subs }),
      setWeaponSearchQuery: (q: string) => set({ weaponSearchQuery: q }),
      setWeaponAttrFilters: (filters: Record<string, string[]>) =>
        set({ weaponAttrFilters: filters }),
      setVisibleWeaponIds: (ids: string[]) => set({ visibleWeaponIds: ids }),

      computePlans: () => {
        const { selectedWeaponIds } = get()
        if (selectedWeaponIds.length === 0) {
          set({ plansMap: {}, planOrder: [], plansStale: false })
          return
        }
        cancelPlansUpdate()
        const ids = new Set(selectedWeaponIds)
        const newPlans = getPlansForSelection(ids)
        const { plansMap, planOrder } = buildPlanMap(newPlans, get().plansMap)
        set({ plansMap, planOrder, plansStale: false })
      },
    }),
    {
      name: 'matrix-session',
      partialize: (state) => ({
        selectedWeaponIds: state.selectedWeaponIds,
        collapsedPlanKeys: state.collapsedPlanKeys,
        dungeonS1Selections: state.dungeonS1Selections,
        selectedRegions: state.selectedRegions,
        selectedSubRegions: state.selectedSubRegions,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        const result = { ...current }
        if (p.selectedWeaponIds !== undefined) {
          result.selectedWeaponIds = sanitizeIdArray(p.selectedWeaponIds, isValidWeaponId)
        }
        if (p.dungeonS1Selections !== undefined) {
          result.dungeonS1Selections = sanitizeIdArrayRecord(
            p.dungeonS1Selections,
            isValidWeaponId,
          )
        }
        if (Array.isArray(p.collapsedPlanKeys)) {
          result.collapsedPlanKeys = p.collapsedPlanKeys.filter(
            (v): v is string => typeof v === 'string',
          )
        }
        if (Array.isArray(p.selectedRegions)) {
          result.selectedRegions = p.selectedRegions.filter(
            (v): v is string => typeof v === 'string',
          )
        }
        if (Array.isArray(p.selectedSubRegions)) {
          result.selectedSubRegions = p.selectedSubRegions.filter(
            (v): v is string => typeof v === 'string',
          )
        }
        return result
      },
      onRehydrateStorage: () => {
        return () => {
          // Recompute plans after rehydration if weapons were selected.
          if (useMatrixStore.getState().selectedWeaponIds.length > 0) {
            useMatrixStore.getState().computePlans()
          }
        }
      },
    },
  ),
)

// ── Cross-store cleanup: when a custom weapon is deleted, remove its ID ──
// ── from selectedWeaponIds so stale IDs don't linger in the session.    ──
useEssenceSettingsStore.subscribe((state, prevState) => {
  const currCustom = state.customWeapons
  const prevCustom = prevState.customWeapons
  if (currCustom === prevCustom) return

  const currIds = new Set(currCustom.map((w) => w.id))
  const removedIds = prevCustom
    .filter((w) => w.id.startsWith(CUSTOM_WEAPON_PREFIX) && !currIds.has(w.id))
    .map((w) => w.id)

  if (removedIds.length === 0) return

  const matrix = useMatrixStore.getState()
  const newSelection = matrix.selectedWeaponIds.filter((id) => !removedIds.includes(id))
  if (newSelection.length === matrix.selectedWeaponIds.length) return

  useMatrixStore.setState({ selectedWeaponIds: newSelection, plansStale: true })
  schedulePlansUpdate(useMatrixStore.setState, useMatrixStore.getState)
})
