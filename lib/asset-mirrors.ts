/**
 * 游戏图标镜像源配置：均镜像上游仓库 cmyyx/cep 的 public/images。
 * 用户可在页面右上角实时切换，选择持久化到 localStorage。
 */

export interface AssetMirror {
  /** 镜像 base URL（仓库路径部分见 lib/asset-urls.ts） */
  base: string
  /** 切换器下拉选项展示名 */
  label: string
}

export const ASSET_MIRRORS = {
  fastly: { base: 'https://fastly.jsdelivr.net', label: 'fastly.jsdelivr.net（默认）' },
  testingcf: { base: 'https://testingcf.jsdelivr.net', label: 'testingcf.jsdelivr.net' },
  jsdelivr: { base: 'https://cdn.jsdelivr.net', label: 'cdn.jsdelivr.net' },
  jsmirrorCom: { base: 'https://cdn.jsdmirror.com', label: 'cdn.jsdmirror.com' },
  jsmirrorCn: { base: 'https://cdn.jsdmirror.cn', label: 'cdn.jsdmirror.cn' },
} as const satisfies Record<string, AssetMirror>

export type AssetMirrorKey = keyof typeof ASSET_MIRRORS

export const DEFAULT_ASSET_MIRROR: AssetMirrorKey = 'fastly'
