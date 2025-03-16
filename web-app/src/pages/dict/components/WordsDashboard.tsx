import { Button, Dropdown, Input, Row, Space, Splitter } from 'antd'
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { JsonItem, WordType } from '../Dict'
import SelectableList from '@/components/list/SelectableList'
import WordsDashboardHeader from './WordsDashboardHeader'
import WordProcessing from './WordProcessing'
import { TabItem } from '@/pages/mindmap/components/MindMapCanvasContainer'
import { ReactFlowProvider } from '@xyflow/react'
import FlowDiagram, { FlowDiagramRef } from '@/features/mindmap/components/FlowDiagram'
import { createMindFile, getMindFile, saveMindFile } from '@/service/mind'
import { useNotification } from '@/hooks/useNotification'
import { DownOutlined } from '@ant-design/icons'
import { CloudMindFile } from '@/pages/mindmap/components/TabpanelCloud'

type FlowData = TabItem
type WordTypeWithCheck = WordType & {
  checked: boolean
}
type SelectableWordType = WordTypeWithCheck & {
  id: string
  disabled: boolean
}

type BasicCloudFile = {
  id?: string
  name: string
  // lastModified: number
  // data: TabItem[]
  order: number
}

const WordsDashboard: FC<{
  rootItem: JsonItem
  fileOlder: number
}> = ({ rootItem, fileOlder }) => {
  const [keywords, setKeywords] = useState('')
  // const [selections, setSelections] = useState<SelectableWordType[]>([])
  const [pendingWords, setPendingWords] = useState<SelectableWordType[]>([])
  const [flowData, setFlowData] = useState<FlowData>({
    key: rootItem.name,
    name: rootItem.name,
    nodes: [],
    edges: [],
  })
  const [selectedTag, setSelectedTag] = useState<SelectableWordType[]>([])
  const [tarNodeId, settarNodeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [isShowMeaning, setIsShowMeaning] = useState(true)
  const [dataSource, setDataSource] = useState<WordTypeWithCheck[]>(
    rootItem.group.map(item => ({ ...item, checked: false })) || [],
  )
  const [fileInfo, setfileInfo] = useState<BasicCloudFile>({
    id: '',
    name: rootItem.name,
    order: 0,
  })

  const flowRef = useRef<FlowDiagramRef>(null)

  const { handleRequestWithNotification, showNotification, showConfirmationDialog } = useNotification()

  const listData: SelectableWordType[] = useMemo(() => {
    const data = dataSource.filter(item => item.name.includes(keywords)) || []
    return data.map(item => ({
      ...item,
      id: item.name,
      disabled: flowData.nodes.some(n => n.data.label === item.name),
      checked: item.checked,
    }))
  }, [dataSource, flowData.nodes, keywords])

  const selections = useMemo(() => {
    return listData.filter(item => item.checked)
  }, [listData])

  const handleTestGetFlowData = () => {
    console.log('flowData: ', flowData)
  }
  const getFlowDataByName = useCallback(
    async (filename: string) => {
      setLoading(true)
      const data = await getMindFile({ field: 'name', operator: '==', value: filename })
      setLoading(false)
      const defaultData = {
        key: rootItem.name,
        name: rootItem.name,
        nodes: [],
        edges: [],
      }
      if (data.length === 0) {
        setFlowData(defaultData)
        setfileInfo(pre => ({
          ...pre,
          id: '',
          order: 0,
        }))
        return
      }
      if (data.length > 1) {
        showNotification('error', `There are multiple ${filename} files, please check them.`, 'message')
        setFlowData(defaultData)
        setfileInfo(pre => ({
          ...pre,
          id: '',
          order: 0,
        }))
        return
      }
      setFlowData(data[0].data[0])
      setfileInfo(pre => ({
        ...pre,
        id: data[0].id,
        order: data[0].order,
      }))

      console.log('getMindFile Data : ', data)
    },
    [rootItem.name, showNotification],
  )

  const handleSyncNo = async () => {
    if (!fileInfo.id) {
      showNotification('error', 'The file is not exist', 'message')
      return
    }

    const params = {
      id: fileInfo.id,
      order: fileOlder,
    }

    await handleRequestWithNotification(async () => saveMindFile(params), {
      successField: null,
      successMessage: 'Saved successfully',
    })
  }

  const handleSaveMindFile = async (): Promise<boolean> => {
    if (!rootItem.name || !flowData.nodes.length || !flowData.edges.length) return false
    const confirmed = await showConfirmationDialog({
      content: 'Are you sure you want to save the FlowData to the cloud end',
    })

    if (!confirmed) return false

    flowData.nodes = flowData.nodes.map(node => {
      if (node.data.isRoot && !node.data.note) {
        node.data.note = `
          【Siblings】 ${rootItem.siblings?.toLocaleString()}
          【词源】 ${rootItem.from}
          【引申】 ${rootItem.extension}
        `
        return node
      }

      const matchedWord = rootItem.group.find(item => item.name === node.data.label)
      if (matchedWord) {
        node.data.note = matchedWord.meaning
        return node
      }

      return node
    })

    const params: Partial<CloudMindFile> = {
      name: rootItem.name,
      data: [flowData],
      order: fileOlder,
    }

    let submitFn: any

    if (fileInfo.id) {
      submitFn = saveMindFile
      params.id = fileInfo.id
    } else {
      submitFn = createMindFile
    }

    await handleRequestWithNotification(async () => submitFn(params), {
      successField: null,
      successMessage: 'Saved successfully',
    })

    getFlowDataByName(rootItem.name)

    return true
  }

  const handleUpdateDataSource = (selectedItemsFn: () => SelectableWordType[]) => {
    console.log('selectedItems', selectedItemsFn())
    const selectedItems = selectedItemsFn()
    setDataSource(prevList =>
      prevList.map(item => {
        if (!item.name.includes(keywords)) return item

        if (selectedItems.some(sel => sel.name === item.name && sel.disabled)) {
          return item
        }

        if (selectedItems.some(sel => sel.name === item.name)) {
          return {
            ...item,
            checked: true,
          }
        } else {
          return {
            ...item,
            checked: false,
          }
        }
      }),
    )
  }

  // const handleListSelecte = (selectedItems: SelectableWordType[]) => {
  //   setSelections(selectedItems)
  // }

  const getSelectableForFlowItem = () =>
    selections.filter(word => !word.disabled).map(word => ({ label: word.name, value: word.name }))

  const handleCreateRootNode = () => {
    flowRef.current?.handleAddRootNode(rootItem.name)
  }
  const handleCreateFreeNode = () => {
    flowRef.current?.handleCreateFreeNode(selectedTag.map(item => item.name))
  }
  const handleCleanCanvas = () => {
    flowRef.current?.handleCleanCanvas()
  }
  const handleAppendChildrenToParent = () => {
    flowRef.current?.handleAppendChildrenToParent(
      tarNodeId,
      selectedTag.map(item => item.name),
    )
  }

  useEffect(() => {
    if (!rootItem.name) return
    getFlowDataByName(rootItem.name)
  }, [getFlowDataByName, rootItem.name])

  const actionMenuItems = [
    {
      key: 1,
      label: (
        <Button onClick={handleCreateRootNode} type="text" size="small" style={{ textAlign: 'left', paddingLeft: 0 }}>
          Create Root Node
        </Button>
      ),
    },
    {
      key: 2,
      label: (
        <Button onClick={handleCreateFreeNode} type="text" size="small" style={{ textAlign: 'left', paddingLeft: 0 }}>
          Create Free Node
        </Button>
      ),
    },
    {
      key: 3,
      label: (
        <Button
          onClick={handleCleanCanvas}
          type="text"
          size="small"
          style={{ textAlign: 'left', paddingLeft: 0 }}
          danger
        >
          Clean Canvas
        </Button>
      ),
    },
    {
      key: 4,
      label: (
        <Button
          onClick={handleSaveMindFile}
          type="text"
          size="small"
          style={{ textAlign: 'left', paddingLeft: 0 }}
          danger
        >
          Save Cloud
        </Button>
      ),
    },
    {
      key: 5,
      label: (
        <Button onClick={handleSyncNo} type="text" size="small" style={{ textAlign: 'left', paddingLeft: 0 }} danger>
          Sync order NO.
        </Button>
      ),
    },
  ]

  return (
    <ReactFlowProvider>
      <Splitter style={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
        <Splitter.Panel
          defaultSize="24%"
          min="10%"
          max="40%"
          style={{ padding: '12px', paddingTop: '40px', height: 'calc(100vh - 28px)', boxSizing: 'border-box' }}
        >
          <div className="flex flex-col " style={{ height: '200px' }}>
            <div className="flex-1" style={{ overflow: 'auto' }}>
              <WordsDashboardHeader rootItem={rootItem} />
            </div>
            {rootItem && (
              <Row className=" my-3">
                <Space>
                  <Input placeholder="enter keywords" value={keywords} onChange={e => setKeywords(e.target.value)} />
                  <Button onClick={() => setPendingWords(selections)}>
                    {selections.length === 0 ? 'Reset Pendings' : 'Set As Pendings'}
                  </Button>
                </Space>
              </Row>
            )}
          </div>
          <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <SelectableList
              data={listData}
              headerExtra={
                <Button onClick={() => setIsShowMeaning(!isShowMeaning)}>
                  {' '}
                  {isShowMeaning ? 'Hide Meaning' : 'Show Meaning'}
                </Button>
              }
              renderItem={item =>
                isShowMeaning ? (
                  <div>
                    <Space>
                      <strong>{item.name}</strong>
                      <span className=" text-gray-400">{item.meaning}</span>
                    </Space>
                    <p>
                      【 <em className=" text-gray-400">{item.structurare}</em>】
                    </p>
                  </div>
                ) : (
                  <strong>{item.name}</strong>
                )
              }
              // onChange={handleListSelecte}
              onUpdate={handleUpdateDataSource}
              multiple
            />
          </div>
        </Splitter.Panel>
        <Splitter.Panel style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 28px)' }}>
          <div style={{ padding: '12px' }}>
            <div style={{ maxHeight: '100px', overflowY: 'scroll' }}>
              <WordProcessing words={pendingWords} onProcessedWords={words => setSelectedTag(words)} />
            </div>
            {/* <div>selectedTag: {selectedTag}</div> */}
            <div className="flex  justify-between items-center my-2">
              <Space>
                <Dropdown
                  menu={{
                    items: actionMenuItems,
                  }}
                >
                  <Button icon={<DownOutlined />}>Canvas Action</Button>
                </Dropdown>

                <Input style={{ width: '150px' }} addonBefore={'Origin Order:'} value={fileOlder} />
                <Input style={{ width: '100px' }} addonBefore={'order:'} value={fileInfo.order} />
              </Space>
              <Space>
                <Input
                  style={{ width: '300px' }}
                  value={tarNodeId}
                  onChange={e => settarNodeId(e.target.value.trim())}
                  placeholder="Copy a Node ID and paste it here"
                  allowClear
                />
                <Button
                  disabled={!tarNodeId || !selectedTag.length}
                  type="primary"
                  color="primary"
                  onClick={handleAppendChildrenToParent}
                >
                  Append
                </Button>
              </Space>
            </div>
          </div>
          {flowData.key && (
            <div className=" flex-1 flex ">
              <FlowDiagram
                ref={flowRef}
                bgColor="rgb(100 116 139)"
                className="flex-1  w-full"
                nodeList={flowData.nodes}
                edgeList={flowData.edges}
                compId={flowData.key}
                showTollbar={false}
                showControls={false}
                showMiniMap={false}
                getSelectableItems={getSelectableForFlowItem}
                onNodeListChange={listFn => setFlowData(pre => ({ ...pre, nodes: listFn(pre.nodes) }))}
                onEdgeListChange={listFn => setFlowData(pre => ({ ...pre, edges: listFn(pre.edges) }))}
              />
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
    </ReactFlowProvider>
  )
}

export default WordsDashboard
