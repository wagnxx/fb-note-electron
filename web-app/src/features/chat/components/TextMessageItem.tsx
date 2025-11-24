import { Flex, Menu, MenuProps, Modal } from 'antd'
import { QRCodeSVG } from 'qrcode.react'
import React, { FC, useRef, useState } from 'react'

type ContextMenuPos = { x: number; y: number }

interface Props {
  content: string
  containerRef: React.RefObject<HTMLDivElement> // ← 聊天区域
}

const MENU_WIDTH = 150
const MENU_HEIGHT = 40

const TextMessageItem: FC<Props> = ({ content, containerRef }) => {
  const [menuPos, setMenuPos] = useState<ContextMenuPos | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)

  const spanRef = useRef<HTMLSpanElement>(null)

  const handleContextMenu = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()

    const selection = window.getSelection()?.toString().trim()
    if (!selection) return

    setSelectedText(selection)

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()

    let x = e.clientX
    let y = e.clientY

    // ---- 保证菜单不会出界 ----
    const maxX = rect.right - MENU_WIDTH * 2
    const maxY = rect.bottom - MENU_HEIGHT * 2
    const minX = rect.left
    const minY = rect.top

    x = Math.min(Math.max(x, minX), maxX)
    y = Math.min(Math.max(y, minY), maxY)

    setMenuPos({ x, y })
  }

  const handleConvertToQR = () => {
    setMenuPos(null)
    setShowQRModal(true)
  }

  const handleSelectAll = () => {
    // setMenuPos(null)

    const el = spanRef.current
    if (!el) return

    const range = document.createRange()
    range.selectNodeContents(el)

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  const contentMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'Convert to QR Code',
      onClick: handleConvertToQR,
    },
    {
      key: '2',
      label: 'all select',
      onClick: handleSelectAll,
    },
  ]

  return (
    <>
      <span ref={spanRef} onContextMenu={handleContextMenu}>
        {content}
      </span>

      {menuPos && (
        <div
          style={{
            position: 'fixed',
            top: menuPos.y,
            left: menuPos.x,
            width: MENU_WIDTH,
            height: MENU_HEIGHT,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 6,
            padding: '6px 10px',
            zIndex: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Menu
            style={{ width: 256 }}
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            // mode={mode}
            // theme={theme}
            items={contentMenuItems}
          />
        </div>
      )}

      <Modal open={showQRModal} footer={null} onCancel={() => setShowQRModal(false)} width={300} title="QR Code">
        <Flex justify="center" align="center" gap={16}>
          <QRCodeSVG value={selectedText} size={160} />
        </Flex>
      </Modal>
    </>
  )
}

export default TextMessageItem
