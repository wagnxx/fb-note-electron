import React, { useEffect, useRef } from 'react'

interface NeighborIndicatorProps {
  containerWidth: number // 容器宽度
  prevTargetY: number // 上一个目标元素顶部的 Y 坐标
  nextTargetY: number // 下一个目标元素顶部的 Y 坐标
}

const NeighborIndicator: React.FC<NeighborIndicatorProps> = ({
  containerWidth,
  prevTargetY,
  nextTargetY,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null)

  // 箭头绘制逻辑
  const drawArrow = (
    svg: SVGSVGElement,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    label: string,
  ) => {
    // 创建线
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', `${startX}`)
    line.setAttribute('y1', `${startY}`)
    line.setAttribute('x2', `${endX}`)
    line.setAttribute('y2', `${endY}`)
    line.setAttribute('stroke', 'red')
    line.setAttribute('stroke-width', '1')
    line.setAttribute('marker-end', 'url(#arrowhead)') // 添加箭头

    // 添加文字标签
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
    text.setAttribute('x', `${midX}`)
    text.setAttribute('y', `${midY - 10}`) // 文字偏移
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('fill', 'black')
    text.textContent = label

    svg.appendChild(line)
    svg.appendChild(text)
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const svg = canvasRef.current.querySelector('svg')
    if (!svg) return

    // 清空之前的内容
    svg.innerHTML = ''

    // 定义箭头起点坐标
    const startX = 0 // 起点在左侧
    const startY = 300 // 起点距离顶部 300px

    // 添加箭头
    drawArrow(svg, startX, startY, containerWidth, prevTargetY, 'Prev')
    drawArrow(svg, startX, startY, containerWidth, nextTargetY, 'Next')
  }, [containerWidth, prevTargetY, nextTargetY])

  return (
    <div ref={canvasRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg width="100%" height="100%">
        <defs>
          {/* 定义箭头样式 */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="red" />
          </marker>
        </defs>
      </svg>
    </div>
  )
}

export default NeighborIndicator
