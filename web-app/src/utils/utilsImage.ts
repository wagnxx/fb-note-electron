export async function mergeBase64Avatars(base64List: string[], size = 100): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const avatarSize = size / 2

  canvas.width = size
  canvas.height = size

  // 关键步骤：绘制纯黑背景，非透明！
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)

  const loadImageFromBase64 = (base64: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = base64
    })

  // 裁剪到最多4张头像
  const count = Math.min(base64List.length, 4)
  const images = await Promise.all(base64List.slice(0, count).map(loadImageFromBase64))

  // 位置：2x2 排列
  const positions = [
    { x: 0, y: 0 },
    { x: avatarSize, y: 0 },
    { x: 0, y: avatarSize },
    { x: avatarSize, y: avatarSize },
  ]

  images.forEach((img, i) => {
    const { x, y } = positions[i]
    ctx.drawImage(img, x, y, avatarSize, avatarSize)
  })

  return canvas.toDataURL('image/png')
}
