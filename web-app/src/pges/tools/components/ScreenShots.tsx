import React, { FC, useState } from 'react'
import { Row, Col, Card, Button, Tooltip } from 'antd'
import ScreenshotModal from './ScreenshotModal'
import './ScreenShots.css'

export interface Prop {
  data: Record<string, string>
}

const normalizeTime = (time: string): string => {
  return time.replace(/-/g, ':')
}

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

  const handleImageLoad = (name: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    setImageSizes(prevState => ({
      ...prevState,
      [name]: { width: naturalWidth, height: naturalHeight },
    }))
  }

  const openModal = (image: string) => {
    setCurrentImage(image)
    setVisibleModal(true)
  }

  const closeModal = () => {
    setVisibleModal(false)
    setCurrentImage('')
  }

  const handleConfirmScreenshot = (range: {
    x: number
    y: number
    width: number
    height: number
  }) => {
    console.log('确认截图区域:', range)
    // 在此处处理截图逻辑
    closeModal() // 关闭modal
  }

  const sortedKeys = Object.keys(data).sort((a, b) => {
    const normalizedA = normalizeTime(a)
    const normalizedB = normalizeTime(b)
    return timeToSeconds(normalizedA) - timeToSeconds(normalizedB)
  })

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <h2>Screen shots</h2>
      <Row gutter={[16, 16]} justify="start">
        {sortedKeys.map(key => {
          const imagePath = data[key]
          const imageSize = imageSizes[key]

          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={3} key={key}>
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
                        <Button type="link" onClick={() => openModal(imagePath)}>
                          View
                        </Button>
                      </Col>
                    </Row>
                  }
                />
              </Card>
            </Col>
          )
        })}
      </Row>

      <ScreenshotModal
        visible={visibleModal}
        currentImage={currentImage}
        onCancel={closeModal}
        onConfirm={handleConfirmScreenshot}
      />
    </div>
  )
}

export default ScreenShots
