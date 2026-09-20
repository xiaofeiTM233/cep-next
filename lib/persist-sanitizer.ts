/**
 * localStorage 持久化数据的值级清洗：
 * 只保留合法 id，损坏/过期数据静默丢弃，避免 store 脏状态。
 */

/** 清洗 id 数组：丢弃非字符串与未通过校验的项，去重。 */
export function sanitizeIdArray(
  raw: unknown,
  isValid: (id: string) => boolean,
): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string' || !isValid(value) || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

/** 清洗单 id：非法返回 fallback（默认 null）。 */
export function sanitizeId(
  raw: unknown,
  isValid: (id: string) => boolean,
  fallback: string | null = null,
): string | null {
  return typeof raw === 'string' && isValid(raw) ? raw : fallback
}

/** 清洗 Record<string, boolean>：只保留布尔值项。 */
export function sanitizeBooleanRecord(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      ([, v]) => typeof v === 'boolean',
    ),
  ) as Record<string, boolean>
}

/** 清洗 Record<string, string[]>（如 S1 选择）：每项走 sanitizeIdArray。 */
export function sanitizeIdArrayRecord(
  raw: unknown,
  isValid: (id: string) => boolean,
): Record<string, string[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = sanitizeIdArray(value, isValid)
  }
  return out
}
