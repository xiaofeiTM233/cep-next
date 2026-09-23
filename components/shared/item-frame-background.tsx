import Image from 'next/image'

/** 卡片背后的边框底图（与原项目一致的素材）。 */
export function ItemFrameBackground() {
  return (
    <Image
      src="/images/item-frame-bg.png"
      alt=""
      aria-hidden="true"
      fill
      unoptimized
      className="pointer-events-none absolute inset-0 z-0 object-cover"
    />
  )
}

export default ItemFrameBackground
