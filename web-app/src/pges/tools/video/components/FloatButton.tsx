import { afterRaf } from '@/utils/utilsAsyncFunc'
import React, { useState, useRef, useEffect, ReactNode } from 'react'

interface FloatButtonProps {
  label: ReactNode
  direction: 'horizontal' | 'vertical' // 控制滑动方向
  edgeDistance: number // 距离容器边缘的距离
  onClick?: () => void // 按钮点击事件
}

const FloatButton: React.FC<FloatButtonProps> = ({ label, direction, edgeDistance, onClick }) => {
  const [position, setPosition] = useState({ x: edgeDistance, y: edgeDistance })
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false) // 标记是否正在拖拽
  const offset = useRef({ x: 0, y: 0 }) // 保存鼠标与按钮的偏移量
  const isDraggingMode = useRef(true) // 标记点击状态，初始化为 true，允许点击

  // 获取容器的宽高
  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  })

  // 更新容器大小
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const updateContainerSize = () => {
        setContainerSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        })
      }

      updateContainerSize()
      window.addEventListener('resize', updateContainerSize)

      return () => window.removeEventListener('resize', updateContainerSize)
    }
  }, [])

  // 用于处理拖拽事件
  const handleDragStart = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    isDragging.current = true
    // 阻止点击事件触发
    target.style.cursor = 'grabbing' // 拖动时的手势
    target.style.opacity = '0.7' // 拖动时减小透明度

    // 记录按钮和鼠标之间的偏移量
    offset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    }

    // 监听鼠标移动和鼠标释放
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
  }

  const handleDragMove = (event: MouseEvent) => {
    if (isDragging.current) {
      isDraggingMode.current = true
      let newX = event.clientX - offset.current.x
      let newY = event.clientY - offset.current.y

      // 限制按钮在容器内的可拖动范围
      if (containerRef.current) {
        const container = containerRef.current
        // 水平方向限制
        if (direction === 'horizontal') {
          newY = position.y // 保持 y 坐标不变
          newX = Math.min(
            Math.max(newX, edgeDistance),
            container.offsetWidth - buttonRef.current!.offsetWidth - edgeDistance,
          )
        }
        // 垂直方向限制
        else if (direction === 'vertical') {
          newX = position.x // 保持 x 坐标不变
          newY = Math.min(
            Math.max(newY, edgeDistance),
            container.offsetHeight - buttonRef.current!.offsetHeight - edgeDistance,
          )
        }
      }

      setPosition({
        x: newX,
        y: newY,
      })
    }
  }

  const handleDragEnd = () => {
    isDragging.current = false
    // isDraggingMode.current = false // 恢复点击状态，允许点击事件触发
    if (buttonRef.current) {
      buttonRef.current.style.cursor = 'grab' // 恢复默认的手势
      buttonRef.current.style.opacity = '1' // 恢复透明度
    }

    afterRaf().then(() => {
      isDraggingMode.current = false
    })

    // 移除鼠标事件监听
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragEnd)
  }

  const handleClick = (event: React.MouseEvent) => {
    // 如果正在拖动，则不触发点击事件
    if (isDraggingMode.current) return

    // 执行点击操作
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: 0,
        // zIndex: 2,
        width: direction === 'vertical' ? '8px' : '100vw',
        height: direction === 'vertical' ? 'calc(100vh - 30px)' : '8px',
        top: direction === 'vertical' ? '30px' : 0,
        // overflow: 'hidden', // 防止按钮溢出
      }}
    >
      <div
        ref={buttonRef}
        onClick={handleClick}
        onMouseDown={handleDragStart} // 按下鼠标开始拖动
        style={{
          position: 'absolute',
          top: position.y,
          left: position.x,
          cursor: 'grab',
          zIndex: 9999, // 确保按钮在最上层
          borderRadius: '100%',
          background: 'rgba(255,255,255,0.9)',
          width: '50px',
          height: '50px',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {label}
      </div>
    </div>
  )
}

export default FloatButton
