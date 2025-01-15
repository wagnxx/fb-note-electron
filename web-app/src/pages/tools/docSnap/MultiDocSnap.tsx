import React, { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Col,
  Row,
  Typography,
  Space,
  Modal,
  Image,
  Divider,
  Checkbox,
  Input,
  Collapse,
  CollapseProps,
} from 'antd'
import { CaretRightOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons'
import { getFileName, resolvePath } from '@/utils/utilsString'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import DocCardItem from './components/DocCardItem'
import Search from 'antd/es/input/Search'
import { createScreenshotDoc } from '@/service/screenshotDoc'
import { uploadFileToFirebase } from '@/service/firebaseUploader'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '@/hooks/useNotification'
import { getFileDialogList } from '@/utils/utilsIpc'

export type Snap = {
  name: string
  path: string
  isRemote?: boolean
}
type SnapGroup = {
  name: string
  path: string
  snaps: Snap[]
}

const { Title, Paragraph } = Typography

const { ipcRenderer, IPC_ACTIONS } = window?.electron || { ipcRenderer: {} }

const MultiDocSnap: React.FC = () => {
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>(
    {},
  )
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [snapGroups, setSnapGroups] = useState<SnapGroup[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null) // 当前拖拽的 id
  const [storageDirectory, setstorageDirectory] = useState('')
  const [mergedDocName, setMergedDocName] = useState('')
  const [keyTermsString, setKeyTermsString] = useState('')
  const [hasError, setHasError] = useState(false)

  const navigate = useNavigate()
  const { handleRequestWithNotification, showNotification, showConfirmationDialog } =
    useNotification()

  const allSnaps = useMemo(() => {
    const all = snapGroups.reduce((prev: Snap[], cur) => {
      const combine: Snap[] = [...prev, ...cur.snaps]
      return combine
    }, []) as Snap[]
    return all
  }, [snapGroups])

  const sortedselectedItems = useMemo(() => {
    const filtered = allSnaps.filter(item => selectedKeys.has(item.path))
    // .map(item => item.path)
    return filtered
  }, [allSnaps, selectedKeys])

  const handlePreview = (snap: Snap) => {
    setPreviewImage(
      snap.isRemote
        ? snap.path
        : `http://localhost:4000/image?src=/${encodeURIComponent(snap.path)}`,
    )
    setPreviewTitle(snap.name)
    setPreviewVisible(true)
  }

  const handleCheckboxChange = (val: boolean, id: string) => {
    const newSelectedKeys = new Set(selectedKeys)
    console.log('val:: ', val)
    if (val === true) {
      newSelectedKeys.add(id)
    } else {
      newSelectedKeys.delete(id)
    }
    setSelectedKeys(newSelectedKeys)
  }

  const allSelectedState = useMemo(() => {
    const selectedCount = selectedKeys.size
    const totalCount = allSnaps.length

    return {
      checkAll: selectedCount !== 0 && selectedCount === totalCount,
      indeterminate: selectedCount > 0 && selectedCount < totalCount,
    }
  }, [allSnaps.length, selectedKeys.size])

  // Helper function to find snap by path
  const findSnapById: (id: string | undefined) => [Snap | null, number, number] = useCallback(
    (id: string | undefined) => {
      // 显式声明返回类型
      if (!id) {
        return [null, -1, -1]
      }

      for (let groupIndex = 0; groupIndex < snapGroups.length; groupIndex++) {
        const snapGroup = snapGroups[groupIndex]
        const snapIndex = snapGroup.snaps.findIndex(snap => snap.path === id)

        if (snapIndex !== -1) {
          return [snapGroup.snaps[snapIndex], groupIndex, snapIndex]
        }
      }

      return [null, -1, -1] // 默认返回值
    },
    [snapGroups],
  )

  const activeMoveItem = useMemo(() => {
    if (!activeId) return null
    return findSnapById(activeId as string)[0]
  }, [activeId, findSnapById])

  const toggleSelectAll = (e: CheckboxChangeEvent) => {
    console.log(e.target.checked)
    const newSelectedKeys: Set<string> = e.target.checked
      ? new Set(allSnaps.map(item => item.path)) // 全选
      : new Set() // 取消全选
    setSelectedKeys(newSelectedKeys)
  }

  const handleCancel = () => setPreviewVisible(false)

  const handleLoadFromLocal = async () => {
    const r = await handleRequestWithNotification(
      async () => await getFileDialogList('directory'),
      { successMessage: '' },
    )

    if (r.ok) {
      if (snapGroups.some(item => item.path === r.folderPath)) {
        showNotification('error', `The path "${r.folderPath}" already exists.`, 'message')
        return
      }
      const group = {
        path: r.folderPath,
        name: getFileName(r.folderPath),
        snaps: r.data?.map((item: string) => ({
          name: item,
          path: resolvePath(r.folderPath, item),
        })),
      }

      setSnapGroups(prev => {
        return [...prev, group]
      })

      console.log('Loaded files group: ', group)
    }
  }

  const handleImageLoad = (path: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    setImageSizes(prevState => ({
      ...prevState,
      [path]: { width: naturalWidth, height: naturalHeight },
    }))
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
    if (active.id !== over?.id) {
      // 使用 active.id 来找到拖动的 snap，并计算新的位置
      const [draggedSnap, activeSnapGroupIndex, activeSnapIndex] = findSnapById(active.id as string)
      const [overSnapGroup, overSnapGroupIndex, overSnapIndex] = findSnapById(over?.id as string)
      // 移动 snapped items
      const updatedSnapGroups = [...snapGroups]
      // 从原组移除拖拽的 snap
      updatedSnapGroups[activeSnapGroupIndex].snaps.splice(activeSnapIndex, 1)
      // 在目标组插入拖拽的 snap
      updatedSnapGroups[overSnapGroupIndex].snaps.splice(overSnapIndex, 0, draggedSnap as Snap)
      setSnapGroups(updatedSnapGroups)
    }
  }

  const handleSelectDirectory = async () => {
    const r = await ipcRenderer?.invoke(IPC_ACTIONS.SELECT_FILE, { type: 'directory' })
    console.log('select files is: ', r)
    setstorageDirectory(r?.path)
  }
  const handleMerge = async () => {
    if (!storageDirectory || !mergedDocName) {
      return
    }
    const regex = /^\/([^\/\0]+(\/[^\/\0]+)*)?$/

    if (!regex.test(storageDirectory)) {
      setHasError(true)

      showNotification('error', 'Please enter a valid file path.', 'message')
      return
    }
    const r = await ipcRenderer?.invoke('check_folder_exist', storageDirectory)
    if (!r) {
      showNotification('error', 'The folder cannot be found.', 'message')
      return
    }

    const names = sortedselectedItems.map(item => item.path)

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to merge these images? [${names}]`,
    })

    if (!confirmed) return

    const images = sortedselectedItems.map(item => ({
      enPath: encodeURIComponent(item.path),
      ...imageSizes[item.path],
    }))

    const params = {
      enFolder: encodeURIComponent(storageDirectory),
      layout: 'col',
      images,
      mergedName: mergedDocName + '_' + 'merged.png',
    }
    console.log('params:: ', params)

    handleRequestWithNotification(
      async () => await ipcRenderer?.invoke(IPC_ACTIONS.MERGE_IMAGES, params),
    )
  }

  const handleUpload = async () => {
    if (!sortedselectedItems.length || !keyTermsString || !mergedDocName) return

    const str = keyTermsString.trim()
    const tags = str.split('/').filter(Boolean)

    const names = sortedselectedItems.map(item => item.name)

    let confirmed = await showConfirmationDialog({
      content: `Are you sure you want to compare these images? [${names}]`,
    })

    if (!confirmed) return
    //Currently, only one merged image is supported
    const filePath = sortedselectedItems[0].path
    const fileBuffer = await ipcRenderer?.invoke('read-stream', encodeURIComponent(filePath))
    if (!fileBuffer) {
      return
    }
    console.log('image path', filePath)
    const fileName = filePath.split('/').pop() // 获取文件名
    const downloadURL = await uploadFileToFirebase(fileBuffer, `screenshotDoc/${fileName}`)

    handleRequestWithNotification(
      async () =>
        createScreenshotDoc({
          docName: mergedDocName,
          screenshots: [downloadURL],
          keyTerms: tags,
        }),
      {
        successField: null,
        errorField: null,
      },
    )
  }

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: <h2 className=" font-semibold">Action Area</h2>,
      children: (
        <>
          <Row>
            <Space direction="horizontal" style={{ marginBottom: '20px' }}>
              <Checkbox
                onChange={toggleSelectAll}
                disabled={allSnaps.length === 0}
                checked={allSelectedState.checkAll}
                indeterminate={allSelectedState.indeterminate}
              >
                {selectedKeys.size === 100 ? 'Deselect All' : 'Select All'}
              </Checkbox>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="middle"
                onClick={handleLoadFromLocal}
              >
                Add Snap
              </Button>
            </Space>
          </Row>
          <Row>
            <Space>
              <Button
                size="middle"
                disabled={selectedKeys.size === 0 || !storageDirectory || !mergedDocName}
                onClick={handleMerge}
              >
                Merge
              </Button>
              <Button
                size="middle"
                disabled={selectedKeys.size === 0 || !mergedDocName}
                onClick={handleUpload}
              >
                Upload
              </Button>
            </Space>
          </Row>
          <Row gutter={20} className=" mt-5">
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Search
                  placeholder="Select a directory for storing project files"
                  allowClear
                  enterButton={<DownOutlined />}
                  size="middle"
                  addonBefore="Select A Directory"
                  value={storageDirectory}
                  onChange={e => setstorageDirectory(e.target.value)}
                  onSearch={handleSelectDirectory}
                  status={hasError ? 'error' : ''}
                />

                <Input
                  placeholder="Enter a name for the merged document to be used as the storage name, either locally or in the cloud."
                  addonBefore="Merged Doc Name"
                  // style={{ width: '100%' }}
                  value={mergedDocName}
                  onChange={e => setMergedDocName(e.target.value)}
                />
                <Input
                  placeholder="Please enter the key terms string, which can contain multiple terms separated by '/'."
                  addonBefore="Key Terms"
                  value={keyTermsString}
                  onChange={e => setKeyTermsString(e.target.value)}
                />
              </Space>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: '2',
      label: <h2 className=" font-semibold">Snap list</h2>,
      children: (
        <div className=" mt-5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            // onDragLeave={handleDragLeave}
          >
            <SortableContext
              items={allSnaps.map(item => item.path)}
              strategy={verticalListSortingStrategy}
            >
              {snapGroups.map((group, groupIndex) => (
                <div key={groupIndex} style={{ marginBottom: '40px' }}>
                  <Title level={3}>{group.name}</Title>
                  <Row gutter={[16, 16]}>
                    {group.snaps.map((snap, snapIndex) => (
                      <Col xs={24} sm={12} md={6} xl={4} xxl={3} key={snapIndex}>
                        <DocCardItem
                          snap={snap}
                          selectedKeys={selectedKeys}
                          onHandleImageLoad={handleImageLoad}
                          onHandleCheckboxChange={handleCheckboxChange}
                          onHandlePreview={handlePreview}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </SortableContext>
            <DragOverlay>
              {activeMoveItem && (
                <div style={{ width: '200px', height: '140px' }}>
                  <DocCardItem
                    snap={activeMoveItem}
                    selectedKeys={selectedKeys}
                    onHandleImageLoad={handleImageLoad}
                    onHandleCheckboxChange={handleCheckboxChange}
                    onHandlePreview={handlePreview}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      ),
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面说明 */}
      <Typography>
        <Space>
          <Title level={2}>Cross-Document snap create</Title>
          <Button type="link" onClick={() => navigate('/tool/docSnap/manage')}>
            View published
          </Button>
        </Space>
        <Paragraph>
          This page allows users to manage and view merged screenshots from multiple documents,
          grouped dynamically with each new addition.
        </Paragraph>
      </Typography>
      <Divider />
      {/* 操作区域 */}
      <Collapse
        bordered={false}
        defaultActiveKey={['1']}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        items={items}
      />

      {/* 展示区域 */}

      {/* 图片预览 Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
        width="80%"
        style={{ textAlign: 'center', zIndex: 999 }}
      >
        <Image
          alt={previewTitle}
          src={previewImage}
          style={{ width: '100%', objectFit: 'contain' }}
          preview={{ visible: false }} // 关闭 Ant Design 默认的预览功能，防止重复显示
        />
      </Modal>
    </div>
  )
}

export default MultiDocSnap
