#!/usr/bin/env node
/**
 * 构建前同步：从上游仓库 cmyyx/cep 拉取游戏数据（weapons / equips / dungeons）。
 *
 * 数据文件原样落盘（import 的 @/types/* 在本项目同样存在，无需转换）：
 *   src/data/weapons.ts   -> data/weapons.ts
 *   src/data/equips.ts    -> data/equips.ts
 *   src/data/dungeons.ts  -> data/dungeons.ts
 *
 * 数据文件是构建产物，已在 .gitignore 中移除版本跟踪；拉取失败直接中止构建
 * （无本地回退，避免部署出陈旧数据）。
 *
 * 图片资源不随仓库分发：运行时经 jsDelivr（Fastly）镜像加载
 * （https://fastly.jsdelivr.net/gh/cmyyx/cep@main/public/images/...，
 *  见 lib/asset-urls.ts），构建时无需下载。
 *
 * 环境变量：
 *   SKIP_DATA_SYNC=1    跳过同步（离线开发时沿用本地已有文件）
 *
 * 跟踪上游 main 最新提交；如需固定版本，改 REF 常量即可。
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = 'cmyyx/cep'
const REF = 'main'
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${REF}`
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TIMEOUT_MS = 20_000

/** 数据文件 → 期望包含的导出标记（识别 404 页面 / 上游结构变更） */
const DATA_FILES = [
  { file: 'weapons.ts', marker: 'export const weapons' },
  { file: 'equips.ts', marker: 'export const equips' },
  { file: 'dungeons.ts', marker: 'export const dungeons' },
]

const log = (...args) => console.log('[sync-data]', ...args)

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`)
  return res.text()
}

/** 按目标文件现有换行风格写入；内容无变化则跳过，避免无谓 diff。 */
async function writeTextMatchingEol(dest, content) {
  let eol = '\n'
  try {
    const current = await readFile(dest, 'utf8')
    if (current === content) return false
    if (current.includes('\r\n')) eol = '\r\n'
  } catch {
    /* 文件不存在，用默认 EOL */
  }
  const normalized = eol === '\r\n' ? content.replace(/\r?\n/g, '\r\n') : content.replace(/\r?\n/g, '\n')
  await writeFile(dest, normalized, 'utf8')
  return true
}

async function syncDataFile({ file, marker }) {
  const dest = join(ROOT, 'data', file)
  const content = await fetchText(`${RAW_BASE}/src/data/${file}`)
  if (content.trimStart().startsWith('<!DOCTYPE') || content.includes('404: Not Found')) {
    throw new Error('upstream returned a not-found page')
  }
  if (!content.includes(marker)) {
    throw new Error(`expected "${marker}" not found — upstream structure changed?`)
  }
  const changed = await writeTextMatchingEol(dest, content)
  log(`data/${file}: ${changed ? 'updated' : 'already up to date'}`)
}

async function main() {
  if (process.env.SKIP_DATA_SYNC === '1') {
    log('skipped (SKIP_DATA_SYNC=1) — using existing local files')
    return
  }
  const failures = []

  for (const item of DATA_FILES) {
    try {
      await syncDataFile(item)
    } catch (err) {
      failures.push(`data/${item.file}: ${err.message}`)
    }
  }
  // 数据文件是构建必需产物且不入库：拉取失败没有回退，直接中止构建
  if (failures.length > 0) {
    console.error('[sync-data] FATAL 数据拉取失败，构建中止（数据文件不入库，无本地回退）：')
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[sync-data] unexpected error:', err)
  process.exit(1)
})
