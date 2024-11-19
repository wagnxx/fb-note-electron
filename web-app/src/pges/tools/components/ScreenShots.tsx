import React, { FC, useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Row, Col, Card, Button, Tooltip, Dropdown, Checkbox, notification, Space } from 'antd'
import ScreenshotModal from './ScreenshotModal'
import './ScreenShots.css'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { showConfirmationDialog } from '@/utils/utilsConfirm'
import { PlayItem } from './FileUpload'
import { copyImagesFromElementsToClipboard } from '@/utils/utilsClipboard'
import { ScreenshotDoc, ScreenshotType } from './VideoPLayer'
import { handleRequestWithNotification } from '@/utils/utilsRequest'
import { mapByField } from '@/utils/utilsArray'
const { ipcRenderer, IPC_ACTIONS } = window.electron || {}
export type Prop = {
  doc: ScreenshotDoc
  video: PlayItem
  onSaveScreenshot: ({
    docId,
    screenshots,
    action,
  }: {
    docId: string
    screenshots: ScreenshotType[]
    action: 'add' | 'remove' | 'refresh'
  }) => void
  onJumpTo: (tm: number) => void
}

const normalizeTime = (time: string): string => {
  return time.replace(/-/g, ':')
}

const timeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds
}
type ScreenTypes = Prop & { _renderCount: number; _refreshPage: () => void }
// type ScreenTypes = Prop
const ScreenShots: FC<ScreenTypes> = ({
  doc,
  video,
  onSaveScreenshot,
  onJumpTo,
  _renderCount,
  _refreshPage,
}) => {
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>(
    {},
  )
  const [visibleModal, setVisibleModal] = useState<boolean>(false)
  const [currentImage, setCurrentImage] = useState<string>('')
  const [filter, setFilter] = useState<{ width?: number; height?: number }>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [cropRange, setCropRange] = useState<Record<'x' | 'y' | 'width' | 'height', number> | null>(
    null,
  )
  // 使用 useRef 来为每个图片创建一个 ref
  const imgRefs = useRef<{ [key: string]: HTMLImageElement | null }>({})

  const [notificationApi, notificationContextHandle] = notification.useNotification()

  const handleImageLoad = (name: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    setImageSizes(prevState => ({
      ...prevState,
      [name]: { width: naturalWidth, height: naturalHeight },
    }))
  }

  const openModal = (image: string) => {
    setCurrentImage(image)
    handleCheckboxChange(image, true)
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
    setCropRange(range)
    closeModal() // 关闭modal
  }

  const screenshotsMap = useMemo(() => {
    const screenshots = mapByField(doc.screenshots, 'name')
    return screenshots
  }, [doc.screenshots])

  const thumbnailsData = useMemo(() => {
    const names = Array.from(selectedKeys)
    return names.map(item => ({
      id: item,
      url: screenshotsMap[item].path,
    }))
  }, [screenshotsMap, selectedKeys])

  const sortedData = useMemo(() => {
    const sortedKeys = Object.keys(screenshotsMap).sort((a, b) => {
      const normalizedA = normalizeTime(a)
      const normalizedB = normalizeTime(b)
      const diff = timeToSeconds(normalizedA) - timeToSeconds(normalizedB)
      return sortOrder === 'asc' ? diff : -diff
    })

    return sortedKeys.map(item => ({
      name: item,
      path: screenshotsMap[item].path,
      at: screenshotsMap[item].at,
    }))
  }, [screenshotsMap, sortOrder])

  // 筛选函数
  const filteredData = useMemo(() => {
    if (!filter.width && !filter.height) return sortedData
    return sortedData.filter(item => {
      const imageSize = imageSizes[item.name]
      if (!imageSize) return false

      const { width, height } = imageSize

      // 动态筛选
      const matchesWidth = filter.width ? width === filter.width : true
      const matchesHeight = filter.height ? height === filter.height : true

      return matchesWidth && matchesHeight
    })
  }, [filter, sortedData, imageSizes])

  const uniqueImageSizes = useMemo(() => {
    const sizes = Object.values(imageSizes).reduce(
      (pre, cur) => {
        if (!pre.some(item => item.width === cur.width && item.height === cur.height)) {
          pre.push(cur)
        }
        return pre
      },
      [] as Array<{ width: number; height: number }>,
    )
    return sizes
  }, [imageSizes])

  // 筛选菜单
  const menu = useMemo(() => {
    // 创建 Menu.Item 对应的 MenuProps 类型的数组
    const widths = [...new Set(uniqueImageSizes.map(item => item.width))]
    const heights = [...new Set(uniqueImageSizes.map(item => item.height))]
    const items = [
      {
        key: 'all',
        label: 'All',
        onClick: () => setFilter({}),
      },
      ...uniqueImageSizes.map(({ width, height }) => ({
        key: `width-${width}-${height}`,
        label: `${width}x${height}`,
        onClick: () => setFilter({ width, height }),
      })),
      ...widths.map(width => ({
        key: `width-${width}`,
        label: `Width ${width}`,
        onClick: () => setFilter({ ...filter, width }),
      })),
      ...heights.map(height => ({
        key: `height-${height}`,
        label: `Height ${height}`,
        onClick: () => setFilter({ ...filter, height }),
      })),
    ]

    // 返回 MenuProps 类型的 Menu 组件
    return items
  }, [uniqueImageSizes, filter])

  const allSelectedState = useMemo(() => {
    const selectedCount = selectedKeys.size
    const totalCount = Object.keys(filteredData).length

    return {
      checkAll: selectedCount === totalCount,
      indeterminate: selectedCount > 0 && selectedCount < totalCount,
    }
  }, [filteredData, selectedKeys.size])

  // 处理全选/取消全选
  const toggleSelectAll = (e: CheckboxChangeEvent) => {
    const newSelectedKeys: Set<string> = e.target.checked
      ? new Set(filteredData.map(item => item.name)) // 全选
      : new Set() // 取消全选
    setSelectedKeys(newSelectedKeys)
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

  // 删除确认
  const handleDelete = async () => {
    if (selectedKeys.size === 0) {
      return
    }

    let confirmed = await showConfirmationDialog({
      content: 'Are you sure you want to delete these images?',
    })

    if (!confirmed) return

    const items = Array.from(selectedKeys).map((name: string) => {
      return {
        path: screenshotsMap[name].path,
        name,
        at: null,
      }
    })

    const paths = items.map(item => encodeURIComponent(item.path))

    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.REMOVE_SCREENSHOT, { enPaths: paths }),
    )

    if (r?.ok) {
      onSaveScreenshot({ docId: video.id, screenshots: items, action: 'remove' })
    }
  }

  // 裁剪确认
  const handleCrop = async () => {
    if (!cropRange || selectedKeys.size === 0) {
      return
    }

    let confirmed = await showConfirmationDialog({
      content: 'Are you sure you want to crop these images?',
    })

    if (!confirmed) return
    const items = Array.from(selectedKeys).map((name: string) => {
      return {
        path: screenshotsMap[name].path,
        name,
      }
    })

    const paths = items.map(item => encodeURIComponent(item.path))

    const params = {
      filePaths: paths,
      cropRange: {
        left: Math.floor(cropRange?.x),
        top: Math.floor(cropRange?.y),
        width: Math.floor(cropRange?.width),
        height: Math.floor(cropRange?.height),
      },
      needDecode: true,
    }

    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.BATCH_CROP_IMAGE, params),
    )

    if (r?.ok) {
      setCropRange(null)
      onSaveScreenshot({
        docId: doc.docId,
        screenshots: [],
        action: 'refresh',
      })
    }
  }
  // 裁剪确认
  const handleMergeImage = async () => {
    if (selectedKeys.size === 0) {
      return
    }

    const names = Array.from(selectedKeys)

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to merge these images? [${names}]`,
    })

    if (!confirmed) return

    const images = names.map(name => ({
      enPath: encodeURIComponent(screenshotsMap[name].path),
      ...imageSizes[name],
    }))

    const params = {
      enFolder: encodeURIComponent(video.url.replace(/\.[\w]+$/, '')),
      layout: 'col',
      images,
      mergedName: video.name + '_' + 'merged.png',
    }
    console.log('params:: ', params)

    const r = await ipcRenderer?.invoke(IPC_ACTIONS.MERGE_IMAGES, params)

    if (r?.ok) {
      notificationApi.success({ message: 'croped successfully' })
      onSaveScreenshot({
        docId: video.id,
        screenshots: [
          {
            name: video.name + '_' + 'merged.png',
            path: video.url.replace(/\.[\w]+$/, '') + '/' + params.mergedName,
            at: null,
          },
        ],
        action: 'add',
      })
    } else {
      notificationApi.error({ message: r?.message })
    }
  }

  const handleCopyImage = async () => {
    if (selectedKeys.size === 0 || !imgRefs.current) {
      return
    }

    const names = Array.from(selectedKeys)
    const selectedImages = names.map(name => imgRefs.current[name]) as HTMLImageElement[]
    const r = await copyImagesFromElementsToClipboard(selectedImages)
    if (r?.ok) {
      notificationApi.success({ message: 'croped successfully' })
    } else {
      notificationApi.error({ message: r?.message })
    }
  }
  const handleExtractText = async () => {
    if (selectedKeys.size === 0) {
      return
    }

    const names = Array.from(selectedKeys)

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to compare these images? [${names}]`,
    })

    if (!confirmed) return
    const item = names[0]
    const params = {
      enVideoPath: encodeURIComponent(video.url),
      name: screenshotsMap[item].name,
      time: screenshotsMap[item].at,
    }
    // EXRACT_VIDEO_FRAME_TEXT
    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.EXRACT_VIDEO_FRAME_TEXT, params),
    )

    console.log('r::', r)

    if (r?.ok) {
      //
    }
  }
  const handleCompare = async () => {
    if (selectedKeys.size === 0) {
      return
    }

    const names = Array.from(selectedKeys)

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to compare these images? [${names}]`,
    })

    if (!confirmed) return

    const params = {
      enPaths: names.map(name => encodeURIComponent(screenshotsMap[name].path)),
    }
    // EXRACT_IMAGES_TEXT
    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.EXRACT_IMAGES_TEXT, params),
    )

    console.log('r::', r)

    if (r?.ok) {
      //
    }
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      {notificationContextHandle}
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Screen Shots
        <span>_renderCount: {_renderCount}</span>
      </h2>

      <Row justify={'start'} align={'middle'}>
        {/* 筛选按钮 */}
        <Dropdown menu={{ items: menu }} trigger={['click']}>
          <Button>
            Filter By: (<span>Width: {filter?.width || '*'}</span>
            <span>Height: {filter?.height || '*'}</span>)
          </Button>
        </Dropdown>

        {/* 排序按钮 */}
        <Button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          style={{ marginLeft: '10px' }}
        >
          Sort by Time ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
        </Button>

        {/* 全选按钮 */}
        <Checkbox
          onChange={toggleSelectAll}
          style={{ marginLeft: '10px' }}
          checked={allSelectedState.checkAll}
          indeterminate={allSelectedState.indeterminate}
        >
          {selectedKeys.size === Object.keys(filteredData).length ? 'Deselect All' : 'Select All'}
        </Checkbox>
      </Row>

      <Row justify={'start'} align={'middle'} gutter={16} style={{ marginTop: '20px' }}>
        {/* 删除按钮 */}
        <Col>
          <Space>
            <Button onClick={handleDelete} danger disabled={selectedKeys.size === 0}>
              Delete
            </Button>

            {/* 裁剪按钮 */}
            <Button onClick={handleCrop} disabled={!cropRange || selectedKeys.size === 0}>
              Crop
            </Button>
            <Button onClick={handleCompare} disabled={selectedKeys.size === 0}>
              Compare Gutter
            </Button>
            <Button onClick={handleExtractText} disabled={selectedKeys.size === 0}>
              Extract Text
            </Button>

            <Button onClick={handleMergeImage} disabled={selectedKeys.size === 0}>
              Merge
            </Button>
            <Button onClick={handleCopyImage} disabled={selectedKeys.size === 0}>
              Copy Images
            </Button>
          </Space>
        </Col>
      </Row>

      <Row style={{ marginTop: '20px' }}>
        <Col>
          <span>Selected crop range:</span>:
        </Col>
        <Col offset={1}>
          {cropRange && (
            <Space>
              <span>x: {cropRange.x}</span>
              <span>y: {cropRange.y}</span>
              <span>width: {cropRange.width}</span>
              <span>height: {cropRange.height}</span>
            </Space>
          )}
        </Col>
      </Row>

      <Row gutter={[16, 16]} justify="start" style={{ marginTop: '20px' }}>
        {filteredData.map(item => {
          const imagePath = item.path
          const imageSize = imageSizes[item.name]

          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={item.name}>
              <Card
                hoverable
                cover={
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '50.58%', // 高度是宽度的 607/1200 = 50.58%
                      background: '#000',
                    }}
                  >
                    <img
                      alt={item.name}
                      ref={el => (imgRefs.current[item.name] = el)}
                      src={
                        'http://localhost:4000/image?src=' +
                        imagePath +
                        '&renderCount=' +
                        _renderCount
                      }
                      crossOrigin="anonymous"
                      onLoad={e => handleImageLoad(item.name, e)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover', // 保证图片等比缩放并覆盖整个区域
                      }}
                    />
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <Row>
                      <Col>
                        <h2>{item.name}</h2>
                      </Col>
                      <Col>
                        <Button
                          size="small"
                          type="text"
                          onClick={() => item.at && onJumpTo(item.at)}
                        >
                          Jump To
                        </Button>
                      </Col>
                    </Row>
                  }
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
                          checked={selectedKeys.has(item.name)}
                          onChange={e => handleCheckboxChange(item.name, e.target.checked)}
                        />
                        <Button type="link" onClick={() => openModal(item.name)}>
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
        _renderCount={_renderCount}
        visible={visibleModal}
        currentImageId={currentImage}
        thumbnails={thumbnailsData}
        onCancel={closeModal}
        onConfirm={handleConfirmScreenshot}
      />
    </div>
  )
}

const ScreenShotsContainer: FC<Prop> = props => {
  const [renderCount, setRenderCount] = useState<number>(0)
  const [lastScreenshots, setLastScreenshots] = useState(props.doc.screenshots)

  const refreshPage = useCallback(() => {
    setRenderCount(renderCount + 1)
  }, [renderCount])

  useEffect(() => {
    // 如果 screenshotsMap 发生变化，更新 renderCount 来触发子组件重新渲染
    if (props.doc.screenshots !== lastScreenshots) {
      setLastScreenshots(props.doc.screenshots)
      setRenderCount(prevCount => prevCount + 1) // 增加渲染计数，触发重新渲染
    }
  }, [props.doc, lastScreenshots])

  const newProps = {
    ...props,
    doc: {
      ...props.doc,
      screenshots: [...props.doc.screenshots],
    },
  }

  return <ScreenShots {...newProps} _renderCount={renderCount} _refreshPage={refreshPage} />
}

export default ScreenShotsContainer
