// utils/utilsCoordinate.ts
export interface Frame {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

/** 支持的旋转角度 */
export type Rotation = 0 | 90 | 180 | 270

/**
 * 将二维码在 scanner 坐标系的 frame 映射到拍摄图像的像素坐标系
 */
export function mapFrameToPhoto(
  codeFrame: Frame,
  scannerFrame: Size,
  photoSize: Size,
  rotation: Rotation = 0,
  mirrored = false,
): Frame {
  // 如果相机旋转 90° 或 270°，需要交换宽高
  const effectivePhotoW = rotation % 180 === 0 ? photoSize.width : photoSize.height
  const effectivePhotoH = rotation % 180 === 0 ? photoSize.height : photoSize.width

  const scaleX = effectivePhotoW / scannerFrame.width
  const scaleY = effectivePhotoH / scannerFrame.height

  let mapped: Frame = {
    x: codeFrame.x * scaleX,
    y: codeFrame.y * scaleY,
    width: codeFrame.width * scaleX,
    height: codeFrame.height * scaleY,
  }

  // 根据旋转角度进行修正
  switch (rotation) {
    case 90:
      mapped = {
        x: photoSize.width - (mapped.y + mapped.height),
        y: mapped.x,
        width: mapped.height,
        height: mapped.width,
      }
      break
    case 180:
      mapped = {
        x: photoSize.width - (mapped.x + mapped.width),
        y: photoSize.height - (mapped.y + mapped.height),
        width: mapped.width,
        height: mapped.height,
      }
      break
    case 270:
      mapped = {
        x: mapped.y,
        y: photoSize.height - (mapped.x + mapped.width),
        width: mapped.height,
        height: mapped.width,
      }
      break
  }

  // 镜像修正
  if (mirrored) {
    mapped.x = photoSize.width - (mapped.x + mapped.width)
  }

  return mapped
}
