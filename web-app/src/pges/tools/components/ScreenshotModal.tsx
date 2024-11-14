import React, { useState, useRef } from 'react'
import { Button, Modal } from 'antd'

interface ScreenshotModalProps {
  visible: boolean
  currentImage: string
  onCancel: () => void
  onConfirm: (range: { x: number; y: number; width: number; height: number }) => void
}

const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  visible,
  currentImage,
  onCancel,
  onConfirm,
}) => {
  const [selectedRange, setSelectedRange] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeCorner, setResizeCorner] = useState<null | 'tl' | 'tr' | 'bl' | 'br'>(null)
  const initialPosition = useRef({ x: 0, y: 0 })
  const initialDimensions = useRef<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // 获取图片的原始尺寸
  const getImageOriginalDimensions = () => {
    if (imageRef.current) {
      return {
        width: imageRef.current.naturalWidth, // 原始宽度
        height: imageRef.current.naturalHeight, // 原始高度
      }
    }
    return { width: 0, height: 0 }
  }

  // 获取容器的尺寸
  const getContainerDimensions = () => {
    if (imageRef.current) {
      return {
        width: imageRef.current.clientWidth, // 容器宽度
        height: imageRef.current.clientHeight, // 容器高度
      }
    }
    return { width: 0, height: 0 }
  }

  // 计算图片的缩放比例
  const getImageScaleFactor = () => {
    const { width: originalWidth, height: originalHeight } = getImageOriginalDimensions()
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()
    const scaleX = containerWidth / originalWidth
    const scaleY = containerHeight / originalHeight
    return { scaleX, scaleY }
  }

  // 处理鼠标按下事件，开始拖拽或缩放
  const handleMouseDown = (
    e: React.MouseEvent,
    corner: 'tl' | 'tr' | 'bl' | 'br' | null = null,
  ) => {
    e.stopPropagation()
    initialDimensions.current = selectedRange
    initialPosition.current = { x: e.clientX, y: e.clientY }
    if (corner) {
      setIsResizing(true)
      setResizeCorner(corner)
    } else {
      setIsDragging(true)
    }
  }
  // 处理鼠标松开事件，结束拖拽或缩放
  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeCorner(null)
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    // 拖拽逻辑
    if (isDragging && selectedRange) {
      handleDrag(e)
    }
    // 缩放逻辑
    if (isResizing && selectedRange && initialDimensions.current) {
      handleResize(e)
    }
  }

  const handleDrag = (e: React.MouseEvent) => {
    // 防止空值错误
    if (!initialDimensions.current || !selectedRange) return

    // 获取容器尺寸
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()

    // 计算鼠标相对初始位置的偏移量
    const offsetX = e.clientX - initialPosition.current.x
    const offsetY = e.clientY - initialPosition.current.y

    // console.log('dragging offsetX:', offsetX, 'offsetY:', offsetY) // 查看每次的偏移量

    // 确保矩形框与鼠标保持固定的相对位置
    let newX = initialDimensions.current.x + offsetX
    let newY = initialDimensions.current.y + offsetY

    // 限制矩形框位置，确保不超出容器范围
    newX = Math.max(0, Math.min(containerWidth - selectedRange.width, newX))
    newY = Math.max(0, Math.min(containerHeight - selectedRange.height, newY))

    // 更新矩形框的位置到 ref 中，以便下次拖拽使用
    initialDimensions.current = {
      x: newX,
      y: newY,
      width: selectedRange.width,
      height: selectedRange.height,
    }

    // 同步更新矩形框的位置
    setSelectedRange(prev => ({
      ...prev!,
      x: newX,
      y: newY,
    }))

    // 更新初始位置，准备下一次拖拽
    initialPosition.current = { x: e.clientX, y: e.clientY }
  }

  // 缩放逻辑：根据拖拽的角落调整矩形框大小
  const handleResize = (e: React.MouseEvent) => {
    if (!initialDimensions.current) return // 防止空值错误
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()

    const offsetX = e.clientX - initialPosition.current.x
    const offsetY = e.clientY - initialPosition.current.y

    let newX = initialDimensions.current.x
    let newY = initialDimensions.current.y
    let newWidth = initialDimensions.current.width
    let newHeight = initialDimensions.current.height

    // 根据拖拽的角落调整矩形框的宽高
    switch (resizeCorner) {
      case 'tl': // 左上角
        newWidth = initialDimensions.current.width - offsetX
        newHeight = initialDimensions.current.height - offsetY
        newX = initialDimensions.current.x + offsetX
        newY = initialDimensions.current.y + offsetY
        break
      case 'tr': // 右上角
        newWidth = initialDimensions.current.width + offsetX
        newHeight = initialDimensions.current.height - offsetY
        newY = initialDimensions.current.y + offsetY
        break
      case 'bl': // 左下角
        newWidth = initialDimensions.current.width - offsetX
        newHeight = initialDimensions.current.height + offsetY
        newX = initialDimensions.current.x + offsetX
        break
      case 'br': // 右下角
        newWidth = initialDimensions.current.width + offsetX
        newHeight = initialDimensions.current.height + offsetY
        break
      default:
        return // 如果没有匹配的 resizeCorner，不做任何操作
    }

    // 限制缩放范围，确保不超出容器范围
    newWidth = Math.max(10, Math.min(containerWidth - newX, newWidth))
    newHeight = Math.max(10, Math.min(containerHeight - newY, newHeight))

    // 更新矩形框的尺寸和位置
    setSelectedRange(prev => ({
      ...prev!,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    }))
  }

  // 截图确认
  const handleConfirmScreenshot = () => {
    if (!selectedRange) return

    const { scaleX, scaleY } = getImageScaleFactor()

    // 将截图框的坐标和尺寸从容器空间转换为原始图片的尺寸
    const originalX = selectedRange.x / scaleX
    const originalY = selectedRange.y / scaleY
    const originalWidth = selectedRange.width / scaleX
    const originalHeight = selectedRange.height / scaleY

    // 返回原始尺寸的截图范围
    onConfirm({
      x: originalX,
      y: originalY,
      width: originalWidth,
      height: originalHeight,
    })
  }

  // 开始截图按钮的点击事件
  const handleStartScreenshot = () => {
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()
    setSelectedRange({ x: 0, y: 0, width: containerWidth, height: containerHeight }) // 设置默认的选区为 100x100
  }

  return (
    <div>
      <Modal
        title="截图预览"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
        style={{ top: '10%' }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={'http://localhost:4000/image?src=' + currentImage}
            alt="screenshot"
            style={{ width: '100%', height: 'auto' }}
          />
          {selectedRange && (
            <div
              style={{
                position: 'absolute',
                left: `${selectedRange.x}px`,
                top: `${selectedRange.y}px`,
                width: `${selectedRange.width}px`,
                height: `${selectedRange.height}px`,
                border: '2px solid red',
                cursor: 'move',
              }}
              onMouseDown={e => handleMouseDown(e)}
            >
              {/* 可选：显示四个角的缩放标志 */}
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '-5px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'green',
                  cursor: 'nwse-resize',
                }}
                onMouseDown={e => handleMouseDown(e, 'tl')}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'green',
                  cursor: 'nesw-resize',
                }}
                onMouseDown={e => handleMouseDown(e, 'tr')}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '-5px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'green',
                  cursor: 'nesw-resize',
                }}
                onMouseDown={e => handleMouseDown(e, 'bl')}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  right: '-5px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'green',
                  cursor: 'nwse-resize',
                }}
                onMouseDown={e => handleMouseDown(e, 'br')}
              />
            </div>
          )}
        </div>
        <Button onClick={handleConfirmScreenshot}>确认截图</Button>
        <Button onClick={handleStartScreenshot} style={{ marginLeft: 8 }}>
          开始截图
        </Button>
      </Modal>
    </div>
  )
}

export default ScreenshotModal
