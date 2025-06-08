// clipboardUtils.ts

// clipboardUtils.ts

/**
 * 从多个 img 元素获取图片数据并复制到剪切板，使用图片的原始尺寸
 * @param imgElements img 元素数组
 * @returns Promise<void> 复制操作完成后返回的Promise
 */
export async function copyImagesFromElementsToClipboard(imgElements: HTMLImageElement[]): Promise<{
  ok: boolean
  message?: string
}> {
  try {
    // 创建一个 canvas 元素
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')

    // 计算合成图像的宽度和高度，使用图片的原始尺寸
    let totalHeight = 0
    let maxWidth = 0
    imgElements.forEach(imgElement => {
      totalHeight += imgElement.naturalHeight // 使用图片的原始高度
      maxWidth = Math.max(maxWidth, imgElement.naturalWidth) // 使用图片的原始宽度
    })

    // 设置 canvas 尺寸为图片的合成尺寸
    canvas.width = maxWidth
    canvas.height = totalHeight

    // 将每一张图片按顺序绘制到 canvas 上，使用图片的原始尺寸
    let currentHeight = 0
    imgElements.forEach(imgElement => {
      ctx.drawImage(imgElement, 0, currentHeight, imgElement.naturalWidth, imgElement.naturalHeight)
      currentHeight += imgElement.naturalHeight
    })

    // 将合成后的 canvas 转换为 Blob
    const imageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject('Failed to generate Blob from canvas')
        }
      }, 'image/png')
    })

    // 使用 Clipboard API 将图片 Blob 复制到剪切板
    const clipboardItem = new ClipboardItem({ 'image/png': imageBlob })
    await navigator.clipboard.write([clipboardItem])

    console.log('Images copied to clipboard!')
    return {
      ok: true,
    }
  } catch (error) {
    console.error('Failed to copy images to clipboard:', error)
    return {
      ok: false,
      message: 'Failed to copy images to clipboard:' + error,
    }
  }
}

/**
 * 复制多个图片内容到剪切板，按顺序合并为一张图片
 * @param imageUrls 图片的URL数组
 * @returns Promise<void> 复制操作完成后返回的Promise
 */
export async function copyImagesToClipboard(imageUrls: string[]): Promise<void> {
  try {
    // 创建一个数组，用于存储每张图片的加载承诺
    const images = await Promise.all(imageUrls.map(url => loadImage(url)))

    // 创建一个 canvas 元素，用于合成所有图片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')

    // 计算 canvas 的宽度和高度
    let totalHeight = 0
    let maxWidth = 0
    images.forEach(img => {
      totalHeight += img.height
      maxWidth = Math.max(maxWidth, img.width)
    })

    // 设置 canvas 尺寸
    canvas.width = maxWidth
    canvas.height = totalHeight

    // 将每张图片按顺序绘制到 canvas 上
    let currentHeight = 0
    images.forEach(img => {
      ctx.drawImage(img, 0, currentHeight)
      currentHeight += img.height
    })

    // 将合成后的 canvas 转换为 Blob
    const imageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject('Failed to generate Blob from canvas')
        }
      }, 'image/png')
    })

    // 使用 Clipboard API 将图片 Blob 复制到剪切板
    const clipboardItem = new ClipboardItem({ 'image/png': imageBlob })
    await navigator.clipboard.write([clipboardItem])

    console.log('Images copied to clipboard!')
    alert('图片已按顺序复制到剪切板！')
  } catch (error) {
    console.error('Failed to copy images to clipboard:', error)
    alert('复制图片失败，请手动复制！')
  }
}

/**
 * 加载单个图片并返回 Image 对象
 * @param url 图片的 URL
 * @returns Promise<HTMLImageElement> 图片加载完成后的 Image 对象
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = url

    img.onload = () => resolve(img)
    img.onerror = () => reject(`Failed to load image at ${url}`)
  })
}

export const copyText = async (text: string): Promise<void | boolean> => {
  try {
    // 使用 Clipboard API 复制文本
    await navigator.clipboard.writeText(text)
    console.log('文本已复制!')
    return true
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}
