import { Button, Checkbox, Col, Row, Tooltip } from 'antd'
import React from 'react'
import { ScreenshotType } from './VideoPLayer'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { useSortable } from '@dnd-kit/sortable'
import { DragOutlined } from '@ant-design/icons'

export type Props = {
  item: ScreenshotType
  imageSizes: Record<string, { width: number; height: number }>
  imgRefs: React.RefObject<{ [key: string]: HTMLImageElement | null }>
  isCroping: boolean
  _renderCount: number
  selectedKeys: Set<string>
  handleImageLoad: (name: string, event: React.SyntheticEvent<HTMLImageElement>) => void
  onJumpTo: (tm: number) => void
  handleCheckboxChange: (key: string, checked: boolean) => void
  openModal: (image: string) => void
}

const ScreenshotCardItem = ({
  item,
  imageSizes,
  imgRefs,
  selectedKeys,
  _renderCount,
  handleImageLoad,
  isCroping,
  onJumpTo,
  handleCheckboxChange,
  openModal,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.name,
  })
  if (!item) return <div>-</div>
  const imagePath = item.path
  const imageSize = imageSizes[item.name]

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
      : '',
    transition,
  }

  const handleOpenModal = (e: CheckboxChangeEvent) => {
    handleCheckboxChange(String(item.name), e.target.checked)
  }
  return (
    <div
      className="screenshot-card-item"
      ref={setNodeRef}
      {...attributes}
      style={{
        ...style,
        background: item?.isCropped ? '#7dbeae' : '#ff7875',
      }}
    >
      <div className="drag-icon   bg-white" style={{ height: 'max-content' }}>
        <DragOutlined {...listeners} color="#fff" />
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '50.58%', // 高度是宽度的 607/1200 = 50.58%
          background: '#000',
        }}
      >
        <img
          alt={String(item.name)}
          ref={el => (imgRefs.current![item.name] = el)}
          src={'http://localhost:4000/image?src=' + imagePath + '&renderCount=' + _renderCount}
          crossOrigin="anonymous"
          onLoad={e => handleImageLoad(String(item.name), e)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'cover', // 保证图片等比缩放并覆盖整个区域
          }}
        />
      </div>

      <div style={{ padding: 8 }}>
        <div className="flex justify-between">
          <h2
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </h2>
          <Button size="small" type="text" onClick={() => item.at !== null && onJumpTo(item.at)}>
            Jump To
          </Button>
        </div>

        <Row justify="space-between">
          <Col>
            <Tooltip title="Image Dimensions">
              <span>{imageSize ? `${imageSize.width} x ${imageSize.height}` : 'Loading...'}</span>
            </Tooltip>
          </Col>
          <Col>
            <Checkbox
              checked={selectedKeys.has(String(item.name))}
              disabled={isCroping}
              // onChange={e => handleCheckboxChange(String(item.name), e.target.checked)}
              onChange={handleOpenModal}
            />
            <Button type="link" onClick={() => openModal(String(item.name))}>
              View
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default ScreenshotCardItem
