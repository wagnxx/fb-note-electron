import React, { useRef, useState, useEffect } from 'react'
import { Modal } from 'antd'

interface Props {
  imageUrl: string
  open: boolean
  onClose: () => void
  onFinish: (base64: string) => void
}

const AvatarCropModal: React.FC<Props> = ({ imageUrl, open, onClose, onFinish }) => {
  const imgRef = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })

  // 裁剪框位置和大小
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, size: 100 })

  // 拖拽状态
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 触摸/鼠标事件兼容处理
  const getEventPos = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX, y: touch.clientY }
    } else {
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
    }
  }

  // 图片加载后设置尺寸和初始裁剪框位置
  const onImageLoad = () => {
    if (imgRef.current) {
      const w = imgRef.current.naturalWidth
      const h = imgRef.current.naturalHeight
      setImgSize({ width: w, height: h })
      setCropBox({
        x: w / 2 - 50,
        y: h / 2 - 50,
        size: 100,
      })
    }
  }

  // 开始拖拽
  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = 'touches' in e ? e.touches[0] : (e as React.MouseEvent)
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const startX = pos.clientX - rect.left
    const startY = pos.clientY - rect.top

    // 判断是否点中裁剪框
    if (
      startX >= cropBox.x &&
      startX <= cropBox.x + cropBox.size &&
      startY >= cropBox.y &&
      startY <= cropBox.y + cropBox.size
    ) {
      setDragging(true)
      setDragOffset({ x: startX - cropBox.x, y: startY - cropBox.y })
    }
  }

  // 拖拽中
  const onDragMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging || !containerRef.current) return
    e.preventDefault()

    const pos = getEventPos(e)
    const rect = containerRef.current.getBoundingClientRect()

    let newX = pos.x - rect.left - dragOffset.x
    let newY = pos.y - rect.top - dragOffset.y

    // 限制裁剪框不出图片边界
    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX + cropBox.size > imgSize.width) newX = imgSize.width - cropBox.size
    if (newY + cropBox.size > imgSize.height) newY = imgSize.height - cropBox.size

    setCropBox(box => ({ ...box, x: newX, y: newY }))
  }

  // 结束拖拽
  const onDragEnd = (e: MouseEvent | TouchEvent) => {
    if (dragging) {
      e.preventDefault()
      setDragging(false)
    }
  }

  // 裁剪并输出 base64
  const handleCrop = () => {
    if (!imgRef.current || !previewRef.current) return

    const canvas = previewRef.current
    const ctx = canvas.getContext('2d')!
    const { x, y, size } = cropBox

    canvas.width = size
    canvas.height = size

    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(imgRef.current, x, y, size, size, 0, 0, size, size)

    const base64 = canvas.toDataURL('image/png')
    onFinish(base64)
    onClose()
  }

  // 注册全局拖拽事件监听（鼠标+触摸）
  useEffect(() => {
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
    window.addEventListener('touchmove', onDragMove, { passive: false })
    window.addEventListener('touchend', onDragEnd)

    return () => {
      window.removeEventListener('mousemove', onDragMove)
      window.removeEventListener('mouseup', onDragEnd)
      window.removeEventListener('touchmove', onDragMove)
      window.removeEventListener('touchend', onDragEnd)
    }
  }, [dragging, dragOffset, cropBox, imgSize])

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleCrop}
      width={imgSize.width + 60}
      title="裁剪头像"
      destroyOnClose
      styles={{
        body: {
          maxHeight: '70vh', // 视口高度 70%
          overflowY: 'auto', // 显示滚动条
        },
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: imgSize.width,
          height: imgSize.height,
          margin: 'auto',
          userSelect: 'none',
          touchAction: 'none', // 阻止浏览器默认触摸滚动
        }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="avatar"
          style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }}
          onLoad={onImageLoad}
          draggable={false}
        />
        {/* 裁剪框 */}
        <div
          style={{
            position: 'absolute',
            border: '2px solid #1890ff',
            boxSizing: 'border-box',
            cursor: 'move',
            left: cropBox.x,
            top: cropBox.y,
            width: cropBox.size,
            height: cropBox.size,
            backgroundColor: 'rgba(24, 144, 255, 0.2)',
            touchAction: 'none',
          }}
        />
      </div>
      <canvas ref={previewRef} style={{ display: 'none' }} />
    </Modal>
  )
}

export default AvatarCropModal
