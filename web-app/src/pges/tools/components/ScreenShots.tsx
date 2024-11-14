import React, { FC, useState, useMemo } from 'react'
import { Row, Col, Card, Button, Tooltip, Dropdown, Checkbox } from 'antd'
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
  const [filter, setFilter] = useState<{ width?: number; height?: number }>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

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
    closeModal() // 关闭modal
  }

  const sortedData = useMemo(() => {
    const sortedKeys = Object.keys(data).sort((a, b) => {
      const normalizedA = normalizeTime(a)
      const normalizedB = normalizeTime(b)
      const diff = timeToSeconds(normalizedA) - timeToSeconds(normalizedB)
      return sortOrder === 'asc' ? diff : -diff
    })
    return sortedKeys.reduce(
      (acc, key) => {
        acc[key] = data[key]
        return acc
      },
      {} as Record<string, string>,
    )
  }, [data, sortOrder])

  // 筛选函数
  const filteredData = useMemo(() => {
    if (!filter.width && !filter.height) return sortedData
    return Object.keys(sortedData)
      .filter(key => {
        const imageSize = imageSizes[key]
        if (!imageSize) return false

        const { width, height } = imageSize

        // 动态筛选
        const matchesWidth = filter.width ? width === filter.width : true
        const matchesHeight = filter.height ? height === filter.height : true

        return matchesWidth && matchesHeight
      })
      .reduce(
        (acc, key) => {
          acc[key] = sortedData[key]
          return acc
        },
        {} as Record<string, string>,
      )
  }, [filter, sortedData, imageSizes])

  // 动态生成筛选选项
  const uniqueWidths = useMemo(() => {
    const widths = new Set<number>()
    Object.values(imageSizes).forEach(size => widths.add(size.width))
    return Array.from(widths)
  }, [imageSizes])

  const uniqueHeights = useMemo(() => {
    const heights = new Set<number>()
    Object.values(imageSizes).forEach(size => heights.add(size.height))
    return Array.from(heights)
  }, [imageSizes])

  // 筛选菜单
  const menu = useMemo(() => {
    // 创建 Menu.Item 对应的 MenuProps 类型的数组
    const items = [
      ...uniqueWidths.map(width => ({
        key: `width-${width}`,
        label: `By Width ${width}`,
        onClick: () => setFilter({ ...filter, width }),
      })),
      ...uniqueHeights.map(height => ({
        key: `height-${height}`,
        label: `By Height ${height}`,
        onClick: () => setFilter({ ...filter, height }),
      })),
      {
        key: 'all',
        label: 'All Images',
        onClick: () => setFilter({}),
      },
    ]

    // 返回 MenuProps 类型的 Menu 组件
    return items
  }, [filter, uniqueWidths, uniqueHeights])

  // 处理全选/取消全选
  const toggleSelectAll = () => {
    if (selectedKeys.size === Object.keys(filteredData).length) {
      setSelectedKeys(new Set()) // 如果已全选，则取消全选
    } else {
      setSelectedKeys(new Set(Object.keys(filteredData))) // 否则全选
    }
  }

  // 处理单个图片的选择状态
  const handleCheckboxChange = (key: string, checked: boolean) => {
    const newSelectedKeys = new Set(selectedKeys)
    if (checked) {
      newSelectedKeys.add(key)
    } else {
      newSelectedKeys.delete(key)
    }
    setSelectedKeys(newSelectedKeys)
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Screen Shots</h2>

      {/* 筛选按钮 */}
      <Dropdown menu={{ items: menu }} trigger={['click']}>
        <Button>Filter By</Button>
      </Dropdown>

      {/* 排序按钮 */}
      <Button
        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        style={{ marginLeft: '10px' }}
      >
        Sort by Time ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
      </Button>

      {/* 全选按钮 */}
      <Button onClick={toggleSelectAll} style={{ marginLeft: '10px' }}>
        {selectedKeys.size === Object.keys(filteredData).length ? 'Deselect All' : 'Select All'}
      </Button>

      <Row gutter={[16, 16]} justify="start" style={{ marginTop: '20px' }}>
        {Object.keys(filteredData).map(key => {
          const imagePath = filteredData[key]
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
                        <Checkbox
                          checked={selectedKeys.has(key)}
                          onChange={e => handleCheckboxChange(key, e.target.checked)}
                        />
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
