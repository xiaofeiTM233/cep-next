import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 图标均为 ~10KB 的 CDN 小图，跳过 Next 图片优化，直接加载 CDN 原图
    unoptimized: true,
    // 游戏图标经 jsDelivr（Fastly）镜像上游仓库 cmyyx/cep，见 lib/asset-urls.ts
    remotePatterns: [
      { protocol: "https", hostname: "fastly.jsdelivr.net" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },
};

export default nextConfig;
