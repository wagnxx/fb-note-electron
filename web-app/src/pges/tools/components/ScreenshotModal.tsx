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
  const initialDimensions = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null,
  )
  const imageRef = useRef<HTMLImageElement | null>(null)

  // 处理鼠标按下事件，开始拖拽或缩放
  const handleMouseDown = (
    e: React.MouseEvent,
    corner: 'tl' | 'tr' | 'bl' | 'br' | null = null,
  ) => {
    if (corner) {
      setIsResizing(true)
      initialDimensions.current = selectedRange
      initialPosition.current = { x: e.clientX, y: e.clientY }
      setResizeCorner(corner)
      e.stopPropagation()
    } else {
      setIsDragging(true)
      initialPosition.current = { x: e.clientX, y: e.clientY }
    }
  }

  // 获取图片的宽高
  const getImageDimensions = () => {
    if (imageRef.current) {
      return {
        width: imageRef.current.width,
        height: imageRef.current.height,
      }
    }
    return { width: 0, height: 0 }
  }

  // 处理鼠标移动事件，执行拖拽或缩放
  const handleMouseMove = (e: React.MouseEvent) => {
    const { width: imageWidth, height: imageHeight } = getImageDimensions()

    if (isDragging && selectedRange) {
      let offsetX = e.clientX - initialPosition.current.x
      let offsetY = e.clientY - initialPosition.current.y

      // 限制拖拽范围，确保不超出图片
      offsetX = Math.max(
        0 - selectedRange.x,
        Math.min(imageWidth - selectedRange.width - selectedRange.x, offsetX),
      )
      offsetY = Math.max(
        0 - selectedRange.y,
        Math.min(imageHeight - selectedRange.height - selectedRange.y, offsetY),
      )

      setSelectedRange(prev => ({
        ...prev!,
        x: prev!.x + offsetX,
        y: prev!.y + offsetY,
      }))
      initialPosition.current = { x: e.clientX, y: e.clientY }
    }

    if (isResizing && selectedRange && initialDimensions.current) {
      const offsetX = e.clientX - initialPosition.current.x
      const offsetY = e.clientY - initialPosition.current.y

      let newX = initialDimensions.current.x
      let newY = initialDimensions.current.y
      let newWidth = initialDimensions.current.width
      let newHeight = initialDimensions.current.height

      // 根据拖拽的角落调整矩形框的宽高
      if (resizeCorner === 'tl') {
        newWidth = initialDimensions.current.width - offsetX
        newHeight = initialDimensions.current.height - offsetY
        newX = initialDimensions.current.x + offsetX
        newY = initialDimensions.current.y + offsetY
      }
      if (resizeCorner === 'tr') {
        newWidth = initialDimensions.current.width + offsetX
        newHeight = initialDimensions.current.height - offsetY
        newY = initialDimensions.current.y + offsetY
      }
      if (resizeCorner === 'bl') {
        newWidth = initialDimensions.current.width - offsetX
        newHeight = initialDimensions.current.height + offsetY
        newX = initialDimensions.current.x + offsetX
      }
      if (resizeCorner === 'br') {
        newWidth = initialDimensions.current.width + offsetX
        newHeight = initialDimensions.current.height + offsetY
      }

      // 限制缩放范围，确保不超出图片
      newWidth = Math.max(10, Math.min(imageWidth - newX, newWidth)) // 最小宽度为10，最大宽度为图片宽度
      newHeight = Math.max(10, Math.min(imageHeight - newY, newHeight)) // 最小高度为10，最大高度为图片高度

      setSelectedRange(prev => ({
        ...prev!,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      }))
    }
  }

  // 处理鼠标松开事件，结束拖拽或缩放
  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeCorner(null)
  }

  // 截图确认
  const handleConfirmScreenshot = () => {
    if (selectedRange) {
      onConfirm(selectedRange)
    }
  }

  // 开始截图按钮的点击事件
  const handleStartScreenshot = () => {
    setSelectedRange({ x: 0, y: 0, width: 100, height: 100 }) // 设置默认的选区为 100x100
  }

  return (
    <div>
      {/* 模态框 */}
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
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            alt="current"
            src={'http://localhost:4000/image?src=' + currentImage}
            style={{ width: '100%' }}
          />
          {selectedRange && (
            <div
              style={{
                position: 'absolute',
                top: selectedRange.y,
                left: selectedRange.x,
                width: selectedRange.width,
                height: selectedRange.height,
                border: '2px dashed rgba(0, 0, 0, 0.5)',
                cursor: isResizing ? 'se-resize' : 'move',
                background: 'rgba(0,0,0,0.3)',
              }}
              onMouseDown={e => handleMouseDown(e)}
            >
              {/* 四个缩放角 */}
              <div
                className="resize-corner tl"
                onMouseDown={e => handleMouseDown(e, 'tl')}
                style={{
                  top: -5,
                  left: -5,
                  width: 10,
                  height: 10,
                  backgroundColor: 'red',
                  cursor: 'nwse-resize',
                }}
              />
              <div
                className="resize-corner tr"
                onMouseDown={e => handleMouseDown(e, 'tr')}
                style={{
                  top: -5,
                  right: -5,
                  width: 10,
                  height: 10,
                  backgroundColor: 'red',
                  cursor: 'nesw-resize',
                }}
              />
              <div
                className="resize-corner bl"
                onMouseDown={e => handleMouseDown(e, 'bl')}
                style={{
                  bottom: -5,
                  left: -5,
                  width: 10,
                  height: 10,
                  backgroundColor: 'red',
                  cursor: 'nesw-resize',
                }}
              />
              <div
                className="resize-corner br"
                onMouseDown={e => handleMouseDown(e, 'br')}
                style={{
                  bottom: -5,
                  right: -5,
                  width: 10,
                  height: 10,
                  backgroundColor: 'red',
                  cursor: 'nwse-resize',
                }}
              />
            </div>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <Button onClick={handleConfirmScreenshot} type="primary" disabled={!selectedRange}>
            确认截图
          </Button>
          <Button onClick={onCancel} style={{ marginLeft: 8 }}>
            取消
          </Button>
          {/* "开始截图" 按钮 */}
          <Button onClick={handleStartScreenshot} type="primary" style={{ marginBottom: 16 }}>
            开始截图
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ScreenshotModal
