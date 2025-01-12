import React, { useState, useRef, useMemo, useReducer, useEffect, useCallback } from 'react'
import { Button, Col, Modal, Row, Space } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import NeighborIndicator from './NeighborIndicator'
interface Thumbnail {
  id: string
  url: string
}
export interface Range {
  x: number
  y: number
  width: number
  height: number
}
interface ScreenshotModalProps {
  visible: boolean
  currentImageId: string
  thumbnails?: Thumbnail[]
  _renderCount: number
  onCancel: () => void
  onConfirm: (
    ranges: {
      name: string
      range: Range
    }[],
  ) => void
}
const NEIGHBOR_ITEM_WIDTH = 400 * 1.5

const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  visible,
  currentImageId,
  _renderCount,
  thumbnails = [],
  onCancel,
  onConfirm,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeCorner, setResizeCorner] = useState<null | 'tl' | 'tr' | 'bl' | 'br'>(null)
  const initialPosition = useRef({ x: 0, y: 0 })
  const initialDimensions = useRef<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const itemContainersRef = useRef<Map<string, { width: number; height: number }>>(new Map())
  const neighborPrevRef = useRef<HTMLImageElement | null>(null)
  const neighborNextRef = useRef<HTMLImageElement | null>(null)
  const [nextTargetY, setnextTargetY] = useState(0)
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [rangeState, updateRangeState] = useReducer(
    setRangeReducer,
    {} as Record<string, Range | null>,
  )

  function setRangeReducer(
    state: Record<string, Range | null>,
    action: { id: string; range: Range; type?: string },
  ) {
    if (!action.id) return state

    if (action.type && action.type === 'delete') {
      const { [action.id]: _, ...rest } = state
      return {
        ...rest,
      }
    }

    return {
      ...state,
      [action.id]: { ...state[action.id], ...action.range },
    }
  }

  const thumbnailsInitial = useMemo(() => {
    if (visible && thumbnails) {
      return thumbnails
    }
    return null
  }, [thumbnails, visible])

  const currentSelectedRange = useMemo(() => {
    if (currentIndex === -1 || !thumbnailsInitial) return
    if (thumbnails.length - 1 < currentIndex) return

    const currentItem = rangeState[thumbnailsInitial[currentIndex].id]
    return currentItem
  }, [currentIndex, rangeState, thumbnails.length, thumbnailsInitial])

  const currentSelectedImage = useMemo(() => {
    if (!thumbnailsInitial) return null
    if (currentIndex === -1) {
      const idx = thumbnailsInitial.findIndex(item => item.id === currentImageId)
      setCurrentIndex(idx)
      return thumbnailsInitial[idx]
    }
    return thumbnailsInitial[currentIndex]
  }, [currentImageId, currentIndex, thumbnailsInitial])

  // 计算图片的缩放比例
  const getImageScaleFactor = useCallback(
    (
      containerFn: (...args: any[]) => { width: number; height: number } = getContainerDimensions,
      applyTo: (...args: any[]) => { width: number; height: number } = getImageOriginalDimensions,
    ) => {
      const { width: containerWidth, height: containerHeight } = containerFn()
      const { width: originalWidth, height: originalHeight } = applyTo()
      if (!originalWidth || !originalHeight) {
        return {
          scaleX: 1,
          scaleY: 1,
        }
      }
      const scaleX = containerWidth / originalWidth
      const scaleY = containerHeight / originalHeight
      return { scaleX, scaleY }
    },
    [],
  )
  // 获取容器的尺寸
  const getContainerDimensions = (
    containerRefCurrent: HTMLImageElement | null = imageRef.current,
  ) => {
    if (containerRefCurrent) {
      return {
        width: containerRefCurrent.clientWidth, // 容器宽度
        height: containerRefCurrent.clientHeight, // 容器高度
      }
    }
    return { width: 0, height: 0 }
  }
  // 获取容器的尺寸
  const getContainerSize = (id?: string) => {
    if (!id) return { width: 0, height: 0 }
    return itemContainersRef.current.get(id) || { width: 0, height: 0 }
  }

  const currentNeighborThumbnails = useMemo(() => {
    if (!thumbnailsInitial?.length || currentIndex === -1) return []

    type Postion = 'prev' | 'next'

    let prevIndex = null
    let nextIndex = null

    if (currentIndex === 0) {
      prevIndex = null
      nextIndex = currentIndex + 1
    } else if (currentIndex === thumbnails.length - 1) {
      prevIndex = currentIndex - 1
      nextIndex = null
    } else {
      prevIndex = currentIndex - 1
      nextIndex = currentIndex + 1
    }

    const validNumbers: { index: number | null; at: Postion }[] = [
      { index: prevIndex, at: 'prev' },
      { index: nextIndex, at: 'next' },
    ]

    const { scaleX: prevScaleX, scaleY: prevScaleY } = getImageScaleFactor(
      () => getContainerSize(neighborPrevRef.current?.id),
      () => getContainerDimensions(neighborPrevRef.current),
    )
    const { scaleX: nextScaleX, scaleY: nextScaleY } = getImageScaleFactor(
      () => getContainerSize(neighborNextRef.current?.id),
      () => getContainerDimensions(neighborNextRef.current),
    )

    return validNumbers.map(item => {
      const thum = thumbnailsInitial[item.index ?? -1] || null

      const range = thum ? rangeState[thum.id] : null

      const scaleX = item.at === 'prev' ? prevScaleX : nextScaleX
      const scaleY = item.at === 'prev' ? prevScaleY : nextScaleY

      const result = {
        index: item.index,
        thumbnail: thum,
        at: item.at,
        range: range
          ? {
              x: range!.x / scaleX,
              y: range!.y / scaleY,
              width: range!.width / scaleX,
              height: range!.height / scaleY,
            }
          : null,
      }
      return result
    })
  }, [thumbnailsInitial, currentIndex, thumbnails.length, rangeState, getImageScaleFactor])

  useEffect(() => {
    // redord current thumbnail contaienr size
    if (!thumbnailsInitial?.[currentIndex]) return
    const currentItemId = thumbnailsInitial[currentIndex].id
    itemContainersRef.current.set(currentItemId, getContainerDimensions())
  }, [currentIndex, thumbnailsInitial])

  function update() {
    const r = neighborPrevRef.current?.clientHeight || 0
    console.log('neighborPrevRef.current?.clientHeight', neighborPrevRef.current?.clientHeight)
    setnextTargetY(r)
  }

  useEffect(() => {
    const handleResize = () => {
      if (neighborPrevRef.current) {
        update()
      }
    }

    // 初始化时获取一次高度
    handleResize()

    // 使用 ResizeObserver 监听高度变化
    const resizeObserver = new ResizeObserver(handleResize)
    if (neighborPrevRef.current) {
      resizeObserver.observe(neighborPrevRef.current)
    } else {
      setnextTargetY(0)
    }

    // 清理观察者
    return () => {
      if (neighborPrevRef.current) {
        resizeObserver.unobserve(neighborPrevRef.current)
      }
    }
  }, [neighborPrevRef.current])

  const handleSelectThumbnail = (index: number) => {
    setCurrentIndex(index)
  }

  const handlePrevThumbnail = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNextThumbnail = () => {
    if (!thumbnailsInitial) return
    if (currentIndex < thumbnailsInitial.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleComplete = () => {
    // Close modal and finalize the screenshot process
    onCancel()
  }
  const handleCancel = (clear: boolean = false) => {
    onCancel()
    if (clear) {
      setCurrentIndex(-1)
    }
  }

  // 获取图片的原始尺寸
  const getImageOriginalDimensions = () => {
    if (imageRef.current) {
      return {
        width: imageRef.current.naturalWidth, // 原始宽度
        height: imageRef.current.naturalHeight, // 原始高度
      }
    }
    return { width: 0, height: 0 }
  }

  // 处理鼠标按下事件，开始拖拽或缩放
  const handleMouseDown = (
    e: React.MouseEvent,
    corner: 'tl' | 'tr' | 'bl' | 'br' | null = null,
  ) => {
    e.stopPropagation()
    initialDimensions.current = currentSelectedRange!
    initialPosition.current = { x: e.clientX, y: e.clientY }
    if (corner) {
      setIsResizing(true)
      setResizeCorner(corner)
    } else {
      setIsDragging(true)
    }
  }
  // 处理鼠标松开事件，结束拖拽或缩放
  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeCorner(null)
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    // 拖拽逻辑
    if (isDragging && currentSelectedRange) {
      handleDrag(e)
    }
    // 缩放逻辑
    if (isResizing && currentSelectedRange && initialDimensions.current) {
      handleResize(e)
    }
  }

  const handleDrag = (e: React.MouseEvent) => {
    // 防止空值错误
    if (!initialDimensions.current || !currentSelectedRange || !thumbnailsInitial) return

    // 获取容器尺寸
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()

    // 计算鼠标相对初始位置的偏移量
    const offsetX = e.clientX - initialPosition.current.x
    const offsetY = e.clientY - initialPosition.current.y

    // console.log('dragging offsetX:', offsetX, 'offsetY:', offsetY) // 查看每次的偏移量

    // 确保矩形框与鼠标保持固定的相对位置
    let newX = initialDimensions.current.x + offsetX
    let newY = initialDimensions.current.y + offsetY

    // 限制矩形框位置，确保不超出容器范围
    newX = Math.max(0, Math.min(containerWidth - currentSelectedRange.width, newX))
    newY = Math.max(0, Math.min(containerHeight - currentSelectedRange.height, newY))

    // 更新矩形框的位置到 ref 中，以便下次拖拽使用
    initialDimensions.current = {
      x: newX,
      y: newY,
      width: currentSelectedRange.width,
      height: currentSelectedRange.height,
    }

    // 同步更新矩形框的位置
    updateRangeState({
      id: thumbnailsInitial[currentIndex].id,
      range: {
        x: newX,
        y: newY,
        width: currentSelectedRange.width,
        height: currentSelectedRange.height,
      },
    })

    // 更新初始位置，准备下一次拖拽
    initialPosition.current = { x: e.clientX, y: e.clientY }
  }

  // 缩放逻辑：根据拖拽的角落调整矩形框大小
  const handleResize = (e: React.MouseEvent) => {
    if (!initialDimensions.current || !thumbnailsInitial) return // 防止空值错误
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()

    const offsetX = e.clientX - initialPosition.current.x
    const offsetY = e.clientY - initialPosition.current.y

    let newX = initialDimensions.current.x
    let newY = initialDimensions.current.y
    let newWidth = initialDimensions.current.width
    let newHeight = initialDimensions.current.height

    // 根据拖拽的角落调整矩形框的宽高
    switch (resizeCorner) {
      case 'tl': // 左上角
        newWidth = initialDimensions.current.width - offsetX
        newHeight = initialDimensions.current.height - offsetY
        newX = initialDimensions.current.x + offsetX
        newY = initialDimensions.current.y + offsetY
        break
      case 'tr': // 右上角
        newWidth = initialDimensions.current.width + offsetX
        newHeight = initialDimensions.current.height - offsetY
        newY = initialDimensions.current.y + offsetY
        break
      case 'bl': // 左下角
        newWidth = initialDimensions.current.width - offsetX
        newHeight = initialDimensions.current.height + offsetY
        newX = initialDimensions.current.x + offsetX
        break
      case 'br': // 右下角
        newWidth = initialDimensions.current.width + offsetX
        newHeight = initialDimensions.current.height + offsetY
        break
      default:
        return // 如果没有匹配的 resizeCorner，不做任何操作
    }

    // 限制缩放范围，确保不超出容器范围
    newWidth = Math.max(10, Math.min(containerWidth - newX, newWidth))
    newHeight = Math.max(10, Math.min(containerHeight - newY, newHeight))

    // 更新矩形框的尺寸和位置
    updateRangeState({
      id: thumbnailsInitial[currentIndex].id,
      range: {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      },
    })
  }

  // 截图确认
  const handleConfirmScreenshot = () => {
    if (!currentSelectedRange) return

    console.log('rangeState::', rangeState)

    const { scaleX, scaleY } = getImageScaleFactor()

    const results = Object.entries(rangeState)
      .filter(([_, range]) => Boolean(range))
      .map(([name, range]) => {
        return {
          name,
          // 将截图框的坐标和尺寸从容器空间转换为原始图片的尺寸
          range: {
            x: range!.x / scaleX,
            y: range!.y / scaleY,
            width: range!.width / scaleX,
            height: range!.height / scaleY,
          },
        }
      })

    // 返回原始尺寸的截图范围
    onConfirm(results)
    setCurrentIndex(-1)
  }

  // 开始截图按钮的点击事件
  const handleStartScreenshot = () => {
    if (!thumbnailsInitial) return
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()
    updateRangeState({
      id: thumbnailsInitial[currentIndex].id,
      range: {
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
      },
    })
  }
  const handleCancelScreenshot = () => {
    if (!thumbnailsInitial) return
    const { width: containerWidth, height: containerHeight } = getContainerDimensions()
    updateRangeState({
      id: thumbnailsInitial[currentIndex].id,
      type: 'delete',
      range: {
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
      },
    })
  }

  useEffect(() => {
    if (!visible || !thumbnails) return
    if (thumbnails.length - 1 < currentIndex) {
      setCurrentIndex(-1)
    }
  }, [currentIndex, thumbnails, visible])

  useEffect(() => {
    if (!visible) return
    const idx = thumbnailsInitial?.findIndex(item => item.id === currentImageId) || -1
    if (idx > -1) {
      setCurrentIndex(idx)
    }
  }, [currentImageId, thumbnailsInitial, visible])

  return (
    <Modal
      title="截图预览"
      footer={null}
      width="100%"
      open={visible}
      onCancel={() => handleCancel()}
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
      styles={{
        body: {
          height: '100vh',
          padding: 0,
        },
        footer: {
          height: 0,
        },
      }}
    >
      <div
        className="body-content"
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          overflow: 'auto',
        }}
      >
        <div className="body-main" style={{ width: '800px', height: '100%', padding: '0 8px' }}>
          <div className=" my-3">
            <Space>
              <Button onClick={handleConfirmScreenshot}>确认截图</Button>

              <Button onClick={() => handleCancel(true)} style={{ marginLeft: 8 }}>
                清空并退出
              </Button>
            </Space>
          </div>
          {/* 缩略图列表 */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <div style={{ display: 'flex', width: 'max-content' }}>
              {thumbnailsInitial &&
                thumbnailsInitial.map((thumbnail, index) => (
                  <div
                    key={thumbnail.id}
                    style={{
                      width: 'fix-content',
                      marginRight: 10,
                      cursor: 'pointer',
                      border: index === currentIndex ? '2px solid #1890ff' : 'none',
                      // scale: index === currentIndex ? 2 : 1,
                    }}
                    onClick={() => handleSelectThumbnail(index)}
                  >
                    <img
                      src={
                        'http://localhost:4000/image?src=' +
                        thumbnail.url +
                        '&_renderCount=' +
                        _renderCount
                      }
                      alt={`Thumbnail ${index}`}
                      title={thumbnail.id}
                      style={{
                        width: 40,
                        height: 30,
                        // height: 60,
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* 缩略图浏览按钮 */}
          {thumbnailsInitial && (
            <div style={{ marginBottom: 4, background: '#fff', padding: '8px ' }}>
              <Row>
                <Col span={8} style={{ textAlign: 'left' }}>
                  <Button danger onClick={handleCancelScreenshot}>
                    取消截图
                  </Button>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <Space>
                    <Button
                      icon={<LeftOutlined />}
                      onClick={handlePrevThumbnail}
                      disabled={currentIndex === 0}
                    />
                    <span>
                      {currentIndex + 1} / {thumbnailsInitial.length}
                    </span>
                    <Button
                      icon={<RightOutlined />}
                      onClick={handleNextThumbnail}
                      disabled={currentIndex === thumbnailsInitial.length - 1}
                    />
                  </Space>
                </Col>
                <Col span={8} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button onClick={handleStartScreenshot}>开始截图</Button>
                  </Space>
                </Col>
              </Row>
            </div>
          )}

          <div
            style={{
              position: 'relative',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {currentSelectedImage && (
              <img
                ref={imageRef}
                src={
                  'http://localhost:4000/image?src=' +
                  currentSelectedImage.url +
                  '&_renderCount=' +
                  _renderCount
                }
                alt="screenshot"
                style={{ width: '100%', height: 'auto' }}
              />
            )}
            {currentSelectedRange && (
              <div
                style={{
                  position: 'absolute',
                  left: `${currentSelectedRange.x}px`,
                  top: `${currentSelectedRange.y}px`,
                  width: `${currentSelectedRange.width}px`,
                  height: `${currentSelectedRange.height}px`,
                  border: '2px solid red',
                  cursor: 'move',
                }}
                onMouseDown={e => handleMouseDown(e)}
              >
                {/* 可选：显示四个角的缩放标志 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    left: '-5px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'green',
                    cursor: 'nwse-resize',
                  }}
                  onMouseDown={e => handleMouseDown(e, 'tl')}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'green',
                    cursor: 'nesw-resize',
                  }}
                  onMouseDown={e => handleMouseDown(e, 'tr')}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-5px',
                    left: '-5px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'green',
                    cursor: 'nesw-resize',
                  }}
                  onMouseDown={e => handleMouseDown(e, 'bl')}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-5px',
                    right: '-5px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'green',
                    cursor: 'nwse-resize',
                  }}
                  onMouseDown={e => handleMouseDown(e, 'br')}
                />
              </div>
            )}
          </div>
        </div>
        <div className="body-indicator" style={{ width: '50px' }}>
          <NeighborIndicator containerWidth={50} prevTargetY={50} nextTargetY={nextTargetY + 100} />
        </div>
        <div
          className="body-sider"
          style={{
            // background: 'red',
            // width: '0',
            flex: '1',
            height: '100%',
            overflow: 'auto',
            zIndex: 9999,
            right: '0',
            // padding: '10px',
            top: 0,
            // border: '1px solid #ddd',
          }}
        >
          <div
            style={{
              // display: 'flex',
              // flexDirection: 'column',
              // justifyContent: 'center',
              // gap: '50px',
              width: 'max-content',
              // height: '800px',
              height: '100%',
            }}
          >
            {currentNeighborThumbnails.length &&
              currentNeighborThumbnails.map(({ thumbnail, range, index, at }) => (
                <div
                  key={at}
                  style={{
                    // width: 'fix-content',

                    cursor: 'pointer',
                    // position: 'absolute',
                    width: NEIGHBOR_ITEM_WIDTH,
                    position: 'relative',
                    top: 0,
                    left: 0,
                    marginTop: '50px',
                  }}
                  onClick={() => handleSelectThumbnail(index ?? -1)}
                >
                  {range && (
                    <div
                      style={{
                        position: 'absolute',
                        left: range.x,
                        top: range.y,
                        width: range.width,
                        height: range.height,
                        background: 'rgba(0,0,0, 0.4)',
                      }}
                    ></div>
                  )}

                  {thumbnail ? (
                    <img
                      ref={at === 'prev' ? neighborPrevRef : neighborNextRef}
                      src={
                        'http://localhost:4000/image?src=' +
                        thumbnail.url +
                        '&_renderCount=' +
                        _renderCount
                      }
                      alt={`Thumbnail ${index}`}
                      title={thumbnail.id}
                      id={thumbnail.id}
                      style={{
                        width: '100%',
                        height: 'auto',
                      }}
                    />
                  ) : (
                    <div style={{ background: '#ddd', color: 'red', textIndent: '2em' }}>
                      {'No ' + at}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ScreenshotModal
