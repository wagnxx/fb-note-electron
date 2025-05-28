import React, { useEffect, useRef, useCallback } from 'react'

type DraggablePosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface UseDraggableOptions {
  position?: DraggablePosition
  ref?: React.RefObject<HTMLElement>
}

export function useDraggable({ position = 'center', ref }: UseDraggableOptions = {}) {
  const innerRef = useRef<HTMLElement>(null)
  const targetRef = ref ?? innerRef
  const positionRef = useRef({ x: 0, y: 0 })

  const applyTransform = useCallback(
    (x: number, y: number) => {
      const el = targetRef.current
      if (el) {
        el.style.transform = `translate(${x}px, ${y}px)`
      }
    },
    [targetRef],
  )

  const getInitialPosition = useCallback(
    (pos: DraggablePosition | { x: number; y: number } = position): { x: number; y: number } => {
      const el = targetRef.current
      if (!el) return { x: 0, y: 0 }

      if (typeof pos === 'object') return pos

      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      switch (pos) {
        case 'center':
          return { x: (vw - rect.width) / 2, y: (vh - rect.height) / 2 }
        case 'top-left':
          return { x: 0, y: 0 }
        case 'top-right':
          return { x: vw - rect.width, y: 0 }
        case 'bottom-left':
          return { x: 0, y: vh - rect.height }
        case 'bottom-right':
          return { x: vw - rect.width, y: vh - rect.height }
        default:
          return { x: 0, y: 0 }
      }
    },
    [position, targetRef],
  )

  const resetPosition = useCallback(
    (pos?: DraggablePosition | { x: number; y: number }) => {
      const { x, y } = getInitialPosition(pos)
      positionRef.current = { x, y }
      applyTransform(x, y)
    },
    [getInitialPosition, applyTransform],
  )

  useEffect(() => {
    resetPosition()
  }, [resetPosition])

  // 拖拽逻辑
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    let dragging = false
    let offsetX = 0
    let offsetY = 0

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.drag-header')) return

      dragging = true
      offsetX = e.clientX - positionRef.current.x
      offsetY = e.clientY - positionRef.current.y
      document.body.style.userSelect = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return

      const x = e.clientX - offsetX
      const y = e.clientY - offsetY
      positionRef.current = { x, y }
      applyTransform(x, y)
    }

    const onMouseUp = () => {
      dragging = false
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [applyTransform, targetRef])

  return { ref: targetRef, resetPosition }
}
