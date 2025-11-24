import React, { useState } from 'react'
import { Card, Button, Input, message } from 'antd'
import { DndContext, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Frame } from '@/utils/utilsCoordinate'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import 'antd/dist/reset.css'

const { TextArea } = Input

interface CodeData {
  frame: Frame
  type: string
  value: string
}

const DEFAULT_STRING = `
{
  "codeScannerFrame": {"height":480,"width":640},
  "codes":[{"frame":{"height":46,"width":47,"x":161,"y":232},"type":"qr","value":"http://ytwl.m2myt.com/pages/livecodecard/index.html?lcode=8571924C0892349"}],
  "imageUri":"http://localhost:4000/image?src=%2FUsers%2Fwagnxx%2FDesktop%2Fimage%2FWechatIMG160.jpeg",
  "photoSize":{"height":3468,"width":4624}
}
`

/** ✅ 可拖拽 Scanner Frame */
const DraggableScanner = ({
  codeScannerFrame,
  codes,
}: {
  codeScannerFrame: { width: number; height: number }
  codes: CodeData[]
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'scanner-frame',
  })

  const translateX = transform?.x ?? 0
  const translateY = transform?.y ?? 0

  const style = {
    transform: CSS.Translate.toString(transform),
    width: codeScannerFrame.width,
    height: codeScannerFrame.height,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.08)',
    border: '2px dashed #0f0',
    cursor: 'grab',
    transition: 'transform 0.05s linear',
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {/* 实时显示位移坐标 */}
      <div
        style={{
          position: 'absolute',
          top: -24,
          left: 0,
          color: '#0f0',
          fontSize: 12,
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 6px',
          borderRadius: 4,
        }}
      >
        ({translateX.toFixed(0)}, {translateY.toFixed(0)})
      </div>

      {/* Code 框 */}
      {codes?.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.frame.x,
            top: c.frame.y,
            width: c.frame.width,
            height: c.frame.height,
            border: '2px solid #00FF00',
            borderRadius: 4,
            boxShadow: '0 0 6px rgba(0,255,0,0.8)',
          }}
          title={c.value}
        />
      ))}
    </div>
  )
}

/** 🧭 主调试组件 */
export default function ScannerOverlayDebugger() {
  const [jsonText, setJsonText] = useState(DEFAULT_STRING)
  const [parsed, setParsed] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(true)

  const handleParse = () => {
    try {
      const data = JSON.parse(jsonText)
      setParsed(data)
      message.success('✅ 数据解析成功')
    } catch {
      message.error('❌ JSON 格式错误')
    }
  }

  return (
    <div className="p-6 flex flex-col items-center space-y-4 bg-[#0b0b0b] min-h-screen text-white">
      <Card
        title={
          <div className="flex justify-between items-center w-full">
            <span>📷 Scanner vs Photo 对齐调试工具</span>
            <Button
              type="link"
              icon={collapsed ? <DownOutlined /> : <UpOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '展开' : '收起'}
            </Button>
          </div>
        }
        className="w-[90%] max-w-5xl"
        bodyStyle={{
          display: collapsed ? 'none' : 'block',
          paddingTop: 0,
        }}
      >
        <TextArea
          rows={6}
          placeholder="粘贴从 RN 打印的 JSON 数据"
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <Button type="primary" onClick={handleParse}>
            渲染
          </Button>
        </div>
      </Card>

      {parsed && (
        <div
          className="relative mt-6 border border-gray-700"
          style={{
            width: parsed.codeScannerFrame.width,
            height: parsed.codeScannerFrame.height,
            overflow: 'hidden',
            background: '#000',
            position: 'relative',
          }}
        >
          {/* 图片 */}
          <img
            src={parsed.imageUri}
            alt="photo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* 拖拽 Scanner Frame（叠加层） */}
          <DndContext>
            <DraggableScanner
              key={JSON.stringify(parsed.codes)}
              codeScannerFrame={parsed.codeScannerFrame}
              codes={parsed.codes}
            />
          </DndContext>
        </div>
      )}
    </div>
  )
}
