import React, { FC, useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Row, Col, Button, Dropdown, Checkbox, Space } from 'antd'
import ScreenshotModal, { Range } from './ScreenshotModal'
import './ScreenShots.css'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { PlayItem } from './FileUpload'
import { copyImagesFromElementsToClipboard } from '@/utils/utilsClipboard'
import { ScreenshotDoc, ScreenshotType } from './VideoPLayer'
// import { handleRequestWithNotification, showNotification } from '@/utils/utilsRequest'
import { mapByField } from '@/utils/utilsArray'
import { parseHHmmssToSeconds } from '@/utils/utilsDate'
import { uploadFileToFirebase } from '@/service/firebaseUploader'
import { checkScreenshotDocExistsByName, createScreenshotDoc } from '@/service/screenshotDoc'
import { useAuth } from '@/context/AuthContext'
import useComputedFilter from './useComputedFilter'
import ScreenshotCardItem from './ScreenshotCardItem'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '@/hooks/useNotification'
const { ipcRenderer, IPC_ACTIONS } = window.electron || {}
export type Prop = {
  doc?: ScreenshotDoc
  video: PlayItem
  onSaveScreenshot: ({
    docId,
    screenshots,
    action,
  }: {
    docId: string
    screenshots: ScreenshotType[]
    action: 'add' | 'modify' | 'remove' | 'refresh'
  }) => void
  onJumpTo: (tm: number) => void
}

const normalizeTime = (time: string): string => {
  return time.replace(/-/g, ':')
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [cropRange, setCropRange] = useState<{ name: string; range: Range }[] | null>()
  const [isCroping, setIsCroping] = useState(false)
  const [docExisted, setDocExisted] = useState(true)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null) // 当前拖拽的 id

  // 使用 useRef 来为每个图片创建一个 ref
  const imgRefs = useRef<{ [key: string]: HTMLImageElement | null }>({})

  const navigate = useNavigate()

  const { handleRequestWithNotification, showNotification, showConfirmationDialog } =
    useNotification()

  const { isAuthenticated } = useAuth()

  const screenshotsMap = useMemo(() => {
    const screenshots = mapByField(doc?.screenshots || [], 'name')
    return screenshots
  }, [doc])

  const thumbnailsData = useMemo(() => {
    const names = Array.from(selectedKeys)
    return names
      .map(item => ({
        id: item,
        url: screenshotsMap[item]?.path,
      }))
      .filter(item => Boolean(item.url))
      .sort((a, b) => {
        const normalizedA = normalizeTime(a.id)
        const normalizedB = normalizeTime(b.id)
        const diff = parseHHmmssToSeconds(normalizedA) - parseHHmmssToSeconds(normalizedB)
        return sortOrder === 'asc' ? diff : -diff
      })
  }, [screenshotsMap, selectedKeys, sortOrder])

  const sortedData = useMemo(() => {
    const sortedKeys = Object.keys(screenshotsMap).sort((a, b) => {
      const normalizedA = normalizeTime(a)
      const normalizedB = normalizeTime(b)
      const diff = parseHHmmssToSeconds(normalizedA) - parseHHmmssToSeconds(normalizedB)
      return sortOrder === 'asc' ? diff : -diff
    })

    return sortedKeys.map(item => ({
      ...screenshotsMap[item],
    }))
  }, [screenshotsMap, sortOrder])

  const { filteredData, setFilteredData, filter, setFilter } = useComputedFilter<ScreenshotType>(
    sortedData,
    imageSizes,
    {
      width: null,
      height: null,
      isCroped: undefined,
    },
  )

  const activedItem = useMemo(() => {
    return filteredData.find(item => item.name === activeId)
  }, [activeId, filteredData])

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
  const sizeMenu = useMemo(() => {
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
  }, [uniqueImageSizes, setFilter, filter])

  const stateMenu = useMemo(() => {
    const items = [
      {
        key: 'all',
        label: 'All',
        onClick: () => setFilter({}),
      },
      {
        key: 'croped',
        label: 'Croped',
        onClick: () => setFilter({ ...filter, isCroped: true }),
      },
      {
        key: 'uncroped',
        label: 'Uncroped',
        onClick: () => setFilter({ ...filter, isCroped: false }),
      },
    ]
    return items
  }, [filter, setFilter])

  const allSelectedState = useMemo(() => {
    const selectedCount = selectedKeys.size
    const totalCount = Object.keys(filteredData).length

    return {
      totalCount,
      checkAll: totalCount !== 0 && selectedCount === totalCount,
      indeterminate: selectedCount > 0 && selectedCount < totalCount,
    }
  }, [filteredData, selectedKeys.size])

  const sortedselectedKeys = useMemo(() => {
    const filtered = filteredData.filter(item => selectedKeys.has(item.name)).map(item => item.name)
    return filtered
  }, [filteredData, selectedKeys])

  // 处理全选/取消全选
  const toggleSelectAll = (e: CheckboxChangeEvent) => {
    const newSelectedKeys: Set<string> = e.target.checked
      ? new Set(filteredData.map(item => item.name)) // 全选
      : new Set() // 取消全选
    setSelectedKeys(newSelectedKeys)
  }

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

  const handleConfirmScreenshot = (
    ranges: {
      name: string
      range: Range
    }[],
  ) => {
    console.log('确认截图区域:', ranges)
    setCropRange(ranges)
    setIsCroping(true)
    closeModal() // 关闭modal
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
    const names = sortedselectedKeys
    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to delete these images? [${names}]`,
    })

    if (!confirmed) return

    const items = Array.from(selectedKeys).map((key: string) => {
      return {
        path: screenshotsMap[key].path,
        name: key,
        at: null,
      }
    })

    const paths = items.map(item => encodeURIComponent(item.path))

    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.REMOVE_SCREENSHOT, { enPaths: paths }),
    )

    if (r?.ok) {
      onSaveScreenshot({ docId: video.id, screenshots: items, action: 'remove' })
      names.forEach(key => selectedKeys.delete(key))
    }
  }

  const handleTryLoadFromLoacal = async () => {
    const docPath = video.url.substring(0, video.url.lastIndexOf('.'))
    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.LS_FOLDER, encodeURIComponent(docPath)),
    )
    if (r?.ok) {
      const items = (r.data as string[]).map(item => {
        const name = item.substring(0, item.lastIndexOf('.'))
        return {
          name: name,
          at: parseHHmmssToSeconds(name, '-'),
          path: docPath + '/' + item,
        }
      })
      onSaveScreenshot({ docId: video.id, screenshots: items, action: 'add' })
    }
  }

  const handleSetAsScropted = async () => {
    if (!doc || selectedKeys.size === 0) {
      return
    }
    const names = sortedselectedKeys

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to set these images as croped? [${names}]`,
    })

    if (!confirmed) return

    const updated = doc.screenshots.filter(item => names.includes(item.name))

    onSaveScreenshot({
      docId: doc.docId,
      screenshots: updated.map(item => ({ ...item, isCropped: true })),
      action: 'modify',
    })
  }

  // 裁剪确认
  const handleCrop = async (byTemplate: boolean) => {
    if (!doc || !cropRange?.length || selectedKeys.size === 0) {
      return
    }

    if (byTemplate && cropRange.length > 1) {
      showNotification(
        'error',
        'When you choose the "bytemplate" option, the cropRange length must be 1.',
        'message',
      )
    }

    const names = sortedselectedKeys.filter(item => {
      return byTemplate || cropRange.find(it => it.name === item)
    })

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to crop these images? [${names}]`,
    })

    if (!confirmed) return
    const items = names.map((key: string) => {
      return {
        path: screenshotsMap[key].path,
        name: key,
      }
    })

    const filePaths = items.map(item => {
      const currentItem = byTemplate ? cropRange[0] : cropRange.find(it => it.name === item.name)

      if (!currentItem) return

      const currentCrop = {
        left: Math.floor(currentItem.range.x),
        top: Math.floor(currentItem.range.y),
        width: Math.floor(currentItem.range.width),
        height: Math.floor(currentItem.range.height),
      }
      return {
        path: encodeURIComponent(item.path),
        cropRange: currentCrop,
      }
    })
    // TODO
    const params = {
      filePaths: filePaths,
      needDecode: true,
    }

    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.BATCH_CROP_IMAGE, params),
    )

    setIsCroping(false)
    if (r?.ok) {
      setCropRange(null)
      const updated = doc.screenshots.filter(item => names.includes(item.name))
      onSaveScreenshot({
        docId: doc.docId,
        screenshots: updated.map(item => ({ ...item, isCropped: true })),
        action: 'modify',
      })
    }
  }
  // 裁剪确认
  const handleMergeImage = async () => {
    if (selectedKeys.size === 0) {
      return
    }

    const names = sortedselectedKeys

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to merge these images? [${names}]`,
    })

    if (!confirmed) return

    const images = names.map(key => ({
      enPath: encodeURIComponent(screenshotsMap[key].path),
      ...imageSizes[key],
    }))

    const params = {
      enFolder: encodeURIComponent(video.url.replace(/\.[\w]+$/, '')),
      layout: 'col',
      images,
      mergedName: video.name + '_' + 'merged.png',
    }
    console.log('params:: ', params)
    const r = await handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.MERGE_IMAGES, params),
      {
        successMessage: 'merged successfully',
      },
    )

    if (r?.ok) {
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
    }
  }

  const handleCreateDoc = async () => {
    if (selectedKeys.size === 0) {
      return
    }

    const names = sortedselectedKeys

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to compare these images? [${names}]`,
    })

    if (!confirmed) return
    //Currently, only one merged image is supported
    const filePath = screenshotsMap[names[0]].path
    const fileBuffer = await ipcRenderer?.invoke('read-stream', encodeURIComponent(filePath))
    if (!fileBuffer) {
      return
    }
    console.log('image path', filePath)
    const fileName = filePath.split('/').pop() // 获取文件名
    const downloadURL = await uploadFileToFirebase(fileBuffer, `screenshotDoc/${fileName}`)

    createScreenshotDoc({
      docName: video.name,
      screenshots: [downloadURL],
    })
  }

  const handleCopyImage = async () => {
    if (selectedKeys.size === 0 || !imgRefs.current) {
      return
    }

    const names = sortedselectedKeys
    const selectedImages = names.map(key => imgRefs.current[key]) as HTMLImageElement[]

    handleRequestWithNotification(
      async () => await copyImagesFromElementsToClipboard(selectedImages),
      {
        successMessage: 'Copyed successfully',
      },
    )
  }
  const handleExtractText = async () => {
    if (selectedKeys.size === 0) {
      return
    }

    const names = sortedselectedKeys

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

    const names = sortedselectedKeys

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to compare these images? [${names}]`,
    })

    if (!confirmed) return

    const params = {
      enPaths: names.map(key => encodeURIComponent(screenshotsMap[key].path)),
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
  const sensors = useSensors(
    useSensor(PointerSensor), // 支持鼠标拖动
  )
  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id) // 记录当前拖拽的元素 id
  }
  const handleDragOver = (event: DragOverEvent) => {
    // 获取当前拖拽的元素
    const { active } = event

    if (active) {
      const target = document.getElementById(String(active.id))
      if (target) {
        target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = filteredData.findIndex(item => item.name === active.id)
    const newIndex = filteredData.findIndex(item => item.name === over.id)

    setFilteredData([...arrayMove(filteredData, oldIndex, newIndex)])
  }

  useEffect(() => {
    if (!isAuthenticated) return
    checkScreenshotDocExistsByName(video.name)
      .then(res => {
        setDocExisted(res)
      })
      .catch(err => {
        setDocExisted(true)
        console.log('checkScreenshotDocExistsByName err: ', err)
      })
  }, [isAuthenticated, video.name])

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        <Space>
          <span>Screen Shots List</span>
          <Button type="link" onClick={() => navigate('/tool/docSnap/manage')}>
            View Published Doc
          </Button>
        </Space>
      </h2>

      <Row justify={'start'} align={'middle'}>
        {/* 筛选按钮 */}
        <Dropdown menu={{ items: sizeMenu }} trigger={['click']}>
          <Button>
            Filter By: (<span>Width: {filter?.width || '*'}</span>
            <span>Height: {filter?.height || '*'}</span>)
          </Button>
        </Dropdown>
        <Dropdown menu={{ items: stateMenu }} trigger={['click']}>
          <Button>
            Filter state By:{' '}
            {filter?.isCroped === undefined ? 'All' : filter?.isCroped ? 'Croped' : 'Uncroped'}
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
          disabled={allSelectedState.totalCount == 0}
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
            <Button onClick={handleDelete} danger disabled={selectedKeys.size === 0 || isCroping}>
              Delete
            </Button>
            <Button onClick={handleTryLoadFromLoacal} danger>
              Try Load
            </Button>

            <Button onClick={handleCompare} disabled={selectedKeys.size === 0 || isCroping}>
              Compare Gutter
            </Button>
            <Button onClick={handleExtractText} disabled={selectedKeys.size === 0 || isCroping}>
              Extract Text
            </Button>

            <Button onClick={handleMergeImage} disabled={selectedKeys.size === 0 || isCroping}>
              Merge
            </Button>
            <Button onClick={handleCopyImage} disabled={selectedKeys.size === 0 || isCroping}>
              Copy Images
            </Button>
            <Button onClick={handleCreateDoc} disabled={selectedKeys.size === 0 || docExisted}>
              Create Doc
            </Button>
          </Space>
        </Col>
      </Row>

      <Row style={{ marginTop: '20px' }} justify={'start'} align={'middle'}>
        <Col>
          <span>Selected crop range:</span>:
        </Col>
        <Col offset={1}>
          <Space>
            {/* {cropRange && (
              <Space>
                <span>x: {cropRange.x}</span>
                <span>y: {cropRange.y}</span>
                <span>width: {cropRange.width}</span>
                <span>height: {cropRange.height}</span>
              </Space>
            )} */}
            {/* 裁剪按钮 */}
            <Button
              onClick={() => handleCrop(false)}
              disabled={!cropRange || selectedKeys.size === 0 || !isCroping}
            >
              Crop
            </Button>
            <Button
              onClick={() => handleCrop(true)}
              disabled={!cropRange || selectedKeys.size === 0 || !isCroping}
            >
              Crop By Template
            </Button>
            <Button onClick={handleSetAsScropted} disabled={selectedKeys.size === 0}>
              Set As Scroped
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} justify={'start'} style={{ marginTop: '20px' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          // onDragLeave={handleDragLeave}
        >
          <SortableContext
            items={filteredData.map(item => item.name)}
            strategy={verticalListSortingStrategy}
          >
            {filteredData.map((item, index) => {
              return (
                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={item.name}>
                  {/* <div className="screenshot-item-container w-full"> */}
                  {/* <ScreenshotSortableItem key={item.name} id={item.name}> */}
                  <ScreenshotCardItem
                    item={item}
                    imageSizes={imageSizes}
                    imgRefs={imgRefs}
                    isCroping={isCroping}
                    _renderCount={_renderCount}
                    selectedKeys={selectedKeys}
                    handleImageLoad={handleImageLoad}
                    onJumpTo={onJumpTo}
                    handleCheckboxChange={handleCheckboxChange}
                    openModal={openModal}
                  />
                  {/* <DragOutlined /> */}
                  {/* </ScreenshotSortableItem> */}
                  {/* </div> */}
                </Col>
              )
            })}
          </SortableContext>

          {/* 拖拽视觉反馈 */}
          <DragOverlay>
            {activedItem ? (
              <div
                style={{
                  padding: '8px',
                  background: '#e0f7fa',
                  border: '1px dashed #00796b',
                  borderRadius: '4px',
                  cursor: 'grabbing',
                }}
              >
                <ScreenshotCardItem
                  item={activedItem}
                  imageSizes={imageSizes}
                  imgRefs={imgRefs}
                  isCroping={isCroping}
                  _renderCount={_renderCount}
                  selectedKeys={selectedKeys}
                  handleImageLoad={handleImageLoad}
                  onJumpTo={onJumpTo}
                  handleCheckboxChange={handleCheckboxChange}
                  openModal={openModal}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
  const [lastScreenshots, setLastScreenshots] = useState<ScreenshotType[]>()

  const refreshPage = useCallback(() => {
    setRenderCount(renderCount + 1)
  }, [renderCount])

  useEffect(() => {
    // 如果 screenshotsMap 发生变化，更新 renderCount 来触发子组件重新渲染
    if (props?.doc?.screenshots && props?.doc?.screenshots !== lastScreenshots) {
      setLastScreenshots(props?.doc?.screenshots || [])
      setRenderCount(prevCount => prevCount + 1) // 增加渲染计数，触发重新渲染
    }
  }, [props.doc, lastScreenshots])

  const newProps = {
    ...props,
    doc: props.doc
      ? {
          ...props.doc,
          screenshots: [...(props?.doc?.screenshots || [])],
        }
      : undefined,
  }

  return <ScreenShots {...newProps} _renderCount={renderCount} _refreshPage={refreshPage} />
}

export default ScreenShotsContainer
