import { DragOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import React from 'react'
import { Snap } from '../MultiDocSnap'

const DocSortedItem = ({ item }: { item: Snap }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.path,
  })

  // 计算拖拽时的样式
  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px) ` : '', // 如果没有拖拽，transform 为空
    transition,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99, // 确保显示在最上层
    backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.1)' : 'red', // 让拖拽中的元素有明显的背景颜色
    height: '10px', // 设定固定的宽高
    width: '10px',
    padding: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center', // 使内容居中
    // borderRadius: '8px',
  }

  return (
    <div
      ref={setNodeRef} // 绑定拖拽元素
      {...attributes} // 绑定拖拽事件
      style={style} // 应用动态计算的样式
    >
      {/* 在拖拽时显示拖拽图标 */}
      <DragOutlined {...listeners} color="#fff" />
    </div>
  )
}

export default DocSortedItem
