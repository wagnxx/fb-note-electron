import React, { FC, useState } from 'react'
import { Row, Col, Card, Modal, Image, Button, Tooltip } from 'antd'
import './ScreenShots.css'

export interface Prop {
  data: Record<string, string>
}

// 辅助函数：统一时间格式（将 "hh-mm-ss" 转换为 "hh:mm:ss"）
const normalizeTime = (time: string): string => {
  return time.replace(/-/g, ':')
}

// 辅助函数：将时间字符串转换为秒数，方便排序
const timeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds
}

const ScreenShots: FC<Prop> = ({ data }) => {
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>(
    {},
  )
  const [visibleModal, setVisibleModal] = useState<boolean>(false)
  const [currentImage, setCurrentImage] = useState<string>('')
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [imageList, setImageList] = useState<string[]>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')
  const [selectedRange, setSelectedRange] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false)
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000')

  // 获取图片原始尺寸
  const handleImageLoad = (name: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    setImageSizes(prevState => ({
      ...prevState,
      [name]: { width: naturalWidth, height: naturalHeight },
    }))
  }

  // 将图片名字（时间）按照时间排序
  const sortedKeys = Object.keys(data).sort((a, b) => {
    const normalizedA = normalizeTime(a)
    const normalizedB = normalizeTime(b)
    return timeToSeconds(normalizedA) - timeToSeconds(normalizedB)
  })

  // 打开 Modal 展示图片放大图
  const openModal = (image: string, index: number) => {
    setCurrentImage(image)
    setCurrentImageIndex(index)
    setImageList(Object.values(data)) // 所有图片路径，作为底部的缩略图列表
    setSelectedThumbnail(image) // 设置选中的缩略图
    setVisibleModal(true)
  }

  // 关闭 Modal
  const closeModal = () => {
    setVisibleModal(false)
    setCurrentImage('')
  }

  // 切换到当前点击的缩略图
  const handleThumbnailClick = (image: string, index: number) => {
    setCurrentImage(image)
    setCurrentImageIndex(index)
    setSelectedThumbnail(image)
  }

  // 选择区域开始
  const handleMouseDown = (e: React.MouseEvent) => {
    const { offsetX, offsetY } = e.nativeEvent
    setSelectedRange({ x: offsetX, y: offsetY, width: 0, height: 0 })
  }

  // 选择区域过程中
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedRange) {
      const { offsetX, offsetY } = e.nativeEvent
      setSelectedRange(prev => {
        if (prev) {
          return {
            ...prev,
            width: offsetX - prev.x,
            height: offsetY - prev.y,
          }
        }
        return prev // 返回 null，避免访问 null 的属性
      })
    }
  }

  // 选择区域结束
  const handleMouseUp = () => {
    // 这里可以进行图片区域验证，确保所选区域合法
  }

  // 确认截图
  const handleConfirmScreenshot = () => {
    // 提交截图请求，携带图片路径和所选区域
    if (selectedRange) {
      console.log('Confirmed Screenshot:', currentImage, selectedRange)
      // 执行截图请求，调用后端 API 等操作
    }
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <h2>Screen shots</h2>
      <Row gutter={[16, 16]}>
        {sortedKeys.map(key => {
          const imagePath = data[key]
          const imageSize = imageSizes[key]

          return (
            <Col span={6} key={key}>
              <Card
                hoverable
                cover={
                  <img
                    alt={key}
                    src={'http://localhost:4000/image?src=' + imagePath}
                    onLoad={e => handleImageLoad(key, e)}
                  />
                }
              >
                <Card.Meta
                  title={key}
                  description={
                    <Row justify="space-between">
                      <Col>
                        <Tooltip title="Image Dimensions">
                          <span>
                            {imageSize ? `${imageSize.width} x ${imageSize.height}` : 'Loading...'}
                          </span>
                        </Tooltip>
                      </Col>
                      <Col>
                        <Tooltip title="Click to view larger image">
                          <span
                            onClick={() => openModal(imagePath, sortedKeys.indexOf(key))}
                            style={{ cursor: 'pointer', color: 'blue' }}
                          >
                            View
                          </span>
                        </Tooltip>
                      </Col>
                    </Row>
                  }
                />
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* Modal 显示大图和缩略图 */}
      <Modal
        visible={visibleModal}
        footer={null}
        onCancel={closeModal}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <Button
            type="text"
            icon="left"
            onClick={() =>
              handleThumbnailClick(
                imageList[currentImageIndex === 0 ? imageList.length - 1 : currentImageIndex - 1],
                currentImageIndex - 1,
              )
            }
            style={{ position: 'absolute', left: 0, top: '50%' }}
          />
          <Image
            width="100%"
            src={'http://localhost:4000/image?src=' + currentImage}
            alt="Large Image"
            style={{ position: 'relative', cursor: 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          <Button
            type="text"
            icon="right"
            onClick={() =>
              handleThumbnailClick(
                imageList[currentImageIndex === imageList.length - 1 ? 0 : currentImageIndex + 1],
                currentImageIndex + 1,
              )
            }
            style={{ position: 'absolute', right: 0, top: '50%' }}
          />

          {/* 区域选择框 */}
          {selectedRange && (
            <div
              style={{
                position: 'absolute',
                top: selectedRange.y,
                left: selectedRange.x,
                width: selectedRange.width,
                height: selectedRange.height,
                border: `2px solid ${selectedColor}`,
                backgroundColor: `${selectedColor}80`, // 半透明背景
              }}
            />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          {imageList.map((image, index) => (
            <div
              key={index}
              style={{
                margin: '0 8px',
                border: image === selectedThumbnail ? '2px solid blue' : 'none',
                padding: image === selectedThumbnail ? '2px' : '0',
                borderRadius: '4px',
              }}
            >
              <Image
                preview={false}
                width={100}
                src={'http://localhost:4000/image?src=' + image}
                alt="Thumbnail"
                style={{ cursor: 'pointer' }}
                onClick={() => handleThumbnailClick(image, index)}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Button type="primary" onClick={handleConfirmScreenshot}>
            Confirm Screenshot
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ScreenShots
