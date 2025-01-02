import { useSortable } from '@dnd-kit/sortable'
import React, { ReactNode } from 'react'

interface SortableItemProps {
  id: string | number
  children: ReactNode
}
export const ScreenshotSortableItem = ({ id, children }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
      : '',
    transition,
    // padding: '8px',
    // margin: '4px 0',
    // border: '1px solid #ddd',
    // background: isDragging ? 'rgba(255, 255, 255, 0.8)' : '#fff', // 拖拽时改变背景颜色
    // borderRadius: '4px',
    // opacity: isDragging ? 0.8 : 1, // 拖拽时减少透明度
    // zIndex: isDragging ? 1000 : 'auto', // 拖拽时提升元素层级
    // zIndex: isDragging ? 1000 : 1000, // 拖拽时提升元素层级
    // cursor: isDragging ? 'grabbing' : 'grab', // 拖拽时改变鼠标样式
    // width: '100%',
    // height: '50px',
    // pointerEvents: isDragging ? 'none' : 'auto',
    // pointerEvents: 'none',
  }

  return (
    <div
      className="screenshot-sortable-item"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners} // 绑定鼠标事件
    >
      {children}
    </div>
  )
}
