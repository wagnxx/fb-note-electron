import React, { useState } from 'react'
import { Popover, Button } from 'antd'

const presetColors = [
  ['#FFFFFF', '#F0F0F0', '#D9D9D9', '#BFBFBF', '#8C8C8C', '#595959', '#262626', '#000000', '#141414'],
  ['#FFD666', '#FFA39E', '#B7EB8F', '#87E8DE', '#91D5FF', '#ADC6FF', '#D3ADF7', '#FFADD2', '#FA8C16'],
  ['#FFC53D', '#FF7875', '#73D13D', '#36CFC9', '#40A9FF', '#597EF7', '#9254DE', '#F759AB', '#D4380D'],
  ['#FA8C16', '#F5222D', '#389E0D', '#1890FF', '#2F54EB', '#722ED1', '#EB2F96', '#A8071A', '#7CB305'],
  ['#D46B08', '#CF1322', '#237804', '#003A8C', '#061178', '#1D39C4', '#5C0011', '#A8071A', '#7D3C98'],
]

const ColorPopover: React.FC<{
  onChaneg?: (color: string) => void
  style?: React.CSSProperties
  className?: string
}> = ({ onChaneg, style = {}, className = '' }) => {
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF')
  const [open, setOpen] = useState(false)

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    onChaneg?.(color)
    setOpen(false) // 选中后关闭 Popover
  }

  const colorGrid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 30px)',
        gridGap: '5px',
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '8px',
      }}
    >
      {presetColors.flat().map(color => (
        <div
          key={color}
          style={{
            width: 30,
            height: 30,
            background: color,
            borderRadius: 4,
            cursor: 'pointer',
            border: selectedColor === color ? '3px solid #000' : '1px solid #ddd',
          }}
          onClick={() => handleColorSelect(color)}
        />
      ))}
    </div>
  )

  return (
    <Popover content={colorGrid} trigger="click" open={open} onOpenChange={setOpen}>
      <Button
        size="middle"
        className={className}
        style={{
          background: selectedColor,
          // color: '#fff',
          // border: '1px solid #ddd',
          ...style,
        }}
      ></Button>
    </Popover>
  )
}

export default ColorPopover
