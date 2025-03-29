import { Button, Dropdown, Input, Row, Space, Splitter, Tabs, TabsProps } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { JsonItem, WordType } from '../Dict'
import SelectableList from '@/components/list/SelectableList'
import WordsDashboardHeader from './WordsDashboardHeader'
import WordProcessing from './WordProcessing'
import { Edge, ReactFlowProvider } from '@xyflow/react'
import { FlowDiagramRef } from '@/features/mindmap/components/flows/Flow'
import FlowWrapper from '@/features/mindmap/components/flows/FlowWrapper'
import { createMindFile, getMindFile, saveMindFile } from '@/service/mind'
import { useNotification } from '@/hooks/useNotification'
import { DownOutlined } from '@ant-design/icons'
import { CloudMindFile } from '@/pages/mindmap/components/TabpanelCloud'
import { useAuth } from '@/context/AuthContext'
import WordRootJsonMenu from './WordRootJsonMenu'
import TreeList, { TreeListRef } from './TreeList'
import { ExtendedNode, TabItem } from '@/features/mindmap/types'

type FlowData = TabItem
type WordTypeWithCheck = WordType & {
  checked: boolean
}
export type SelectableWordType = WordTypeWithCheck & {
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

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

enum SelectionTabsKey {
  list = '1',
  tree = '2',
}

const WordsDashboard = () => {
  const [rootItem, setrootItem] = useState<JsonItem | null>(null)
  const [fileOlder, setFileOlder] = useState(0)

  const [keywords, setKeywords] = useState('')
  const [pendingWords, setPendingWords] = useState<SelectableWordType[]>([])
  const [initialFlowData, setInitialFlowData] = useState<FlowData | null>(null)
  const [flowData, setFlowData] = useState<FlowData | null>(null)
  const [selectedTag, setSelectedTag] = useState<SelectableWordType[]>([])
  const [tarNodeId, settarNodeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [isShowMeaning, setIsShowMeaning] = useState(true)
  const [dataSource, setDataSource] = useState<WordTypeWithCheck[]>([])
  const [fileInfo, setfileInfo] = useState<BasicCloudFile>({
    id: '',
    name: '',
    order: 0,
  })

  const [activeTabsKey, setActiveTabsKey] = useState<SelectionTabsKey>(SelectionTabsKey.list)
  const flowRef = useRef<FlowDiagramRef>(null)
  const treeRef = useRef<TreeListRef>(null)

  const { isAuthenticated } = useAuth()

  const { handleRequestWithNotification, showNotification, showConfirmationDialog } = useNotification()

  const handleFetchDictItem = async (opions: { key: string }) => {
    try {
      const { key } = opions
      ipcRenderer.invoke(IPC_ACTIONS.READ_STREAM, encodeURIComponent(key)).then((res: any) => {
        const decoder = new TextDecoder('utf-8')
        const jsonString = decoder.decode(res)
        const jsonData = JSON.parse(jsonString)
        const tabItemsData = jsonData[0]
        setrootItem(tabItemsData)
        setDataSource(tabItemsData.group.map((item: WordTypeWithCheck) => ({ ...item, checked: false })) || [])
        setfileInfo(pre => ({ ...pre, name: tabItemsData.name }))

        const reg = /\/(\d+)\..+$/
        const match = key.match(reg)
        if (match) {
          setFileOlder(Number(match[1]))
        } else {
          setFileOlder(0)
          console.log('No match found')
        }
      })
    } catch (error) {
      console.log('invoke handleFetchDictItem error: ', error)
    }
  }

  const listData: SelectableWordType[] = useMemo(() => {
    const data = dataSource.filter(item => item.name.includes(keywords)) || []
    return data.map(item => ({
      ...item,
      id: item.name,
      disabled: (flowData?.nodes || []).some(n => n.data.label === item.name),
      checked: item.checked,
    }))
  }, [dataSource, flowData, keywords])

  const selections = useMemo(() => {
    return listData.filter(item => item.checked)
  }, [listData])

  const getFlowDataByName = useCallback(
    async (filename: string) => {
      if (!rootItem?.name) return

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
        setInitialFlowData(() => defaultData)
        setFlowData(() => defaultData)
        setfileInfo(pre => ({
          ...pre,
          id: '',
          order: 0,
        }))
        return
      }
      if (data.length > 1) {
        showNotification('error', `There are multiple ${filename} files, please check them.`, 'message')
        setInitialFlowData(() => defaultData)
        setFlowData(() => defaultData)
        setfileInfo(pre => ({
          ...pre,
          id: '',
          order: 0,
        }))
        return
      }
      setInitialFlowData(data[0].data[0])
      setFlowData(data[0].data[0])

      setfileInfo(pre => ({
        ...pre,
        id: data[0].id,
        order: data[0].order,
      }))

      console.log('getMindFile Data : ', data)
    },
    [rootItem, showNotification],
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
    if (!rootItem?.name || !flowData?.nodes.length || !flowData.edges.length) return false
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

    const flowDataSubmit = JSON.parse(JSON.stringify(flowData))

    const params: Partial<CloudMindFile> = {
      name: rootItem.name,
      data: [flowDataSubmit],
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

  const getSelectableForFlowItem = useCallback(
    () => pendingWords.filter(word => !word.disabled).map(word => ({ label: word.name, value: word.name })),
    [pendingWords],
  )

  const handleCreateRootNode = () => {
    if (!rootItem?.name) {
      showNotification('error', '"rootItem.name does not exist, please check it."', 'message')
      return
    }
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

  const handleSetTags = () => setPendingWords(selections)

  const handleCreateGroupNodes = () => {
    const groups = treeRef.current?.getCheckedNodes()
    console.log('treeRef nodes: ', groups)
    flowRef.current?.handleCreateGroupNodes(groups?.nest || [])
  }

  const updateNodes = useCallback(
    (fn: (data: ExtendedNode[]) => ExtendedNode[]) => {
      if (!initialFlowData?.name) return

      setFlowData(pre => {
        if (!pre) {
          throw new Error('flowData is null, cannot update nodes.')
        }

        return {
          ...pre,
          nodes: fn(pre.nodes),
        }
      })
    },
    [initialFlowData?.name],
  )

  const updateEdges = useCallback(
    (fn: (data: Edge[]) => Edge[]) => {
      if (!initialFlowData?.name) return
      setFlowData(pre => {
        if (!pre) {
          throw new Error('flowData is null, cannot update nodes.')
        }

        return {
          ...pre,
          edges: fn(pre.edges),
        }
      })
    },
    [initialFlowData?.name],
  )

  useEffect(() => {
    if (!rootItem?.name || !isAuthenticated) return
    getFlowDataByName(rootItem.name)
  }, [getFlowDataByName, isAuthenticated, rootItem])

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

  const selectItems: TabsProps['items'] = [
    {
      key: SelectionTabsKey.list,
      label: 'Flat List',
      children: (
        <>
          {rootItem && (
            <Row className=" my-3">
              <Space>
                <Input placeholder="enter keywords" value={keywords} onChange={e => setKeywords(e.target.value)} />
                <Button onClick={handleSetTags}>
                  {selections.length === 0 ? 'Reset Pendings' : 'Set As Pendings'}
                </Button>
              </Space>
            </Row>
          )}
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
                <div style={{ fontSize: '12px' }}>
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
        </>
      ),
    },
    {
      key: SelectionTabsKey.tree,
      label: 'Tree List',
      children: (
        <>
          <Space>
            <h3>Tree header</h3>
            <Button onClick={handleCreateGroupNodes}>Create Group Nodes</Button>
          </Space>
          <TreeList data={listData} ref={treeRef} />
        </>
      ),
    },
  ]

  return (
    <ReactFlowProvider>
      <Splitter style={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
        <Splitter.Panel
          defaultSize="30%"
          min="10%"
          max="40%"
          style={{ padding: '12px', height: 'calc(100vh - 28px)', boxSizing: 'border-box' }}
        >
          <div className="flex flex-col relative " style={{ height: '250px' }}>
            <div className=" absolute z-50" style={{ height: '50px', top: 0 }}>
              <WordRootJsonMenu onItemClick={handleFetchDictItem} rootLabel="Choose WordRoot Json File" />
            </div>
            <div className="flex-1 " style={{ overflow: 'auto', paddingTop: '50px' }}>
              <WordsDashboardHeader rootItem={rootItem} />
            </div>
          </div>
          <div>
            <Tabs
              style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
              items={selectItems}
              activeKey={activeTabsKey}
              onChange={val => setActiveTabsKey(val as unknown as SelectionTabsKey)}
            ></Tabs>
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
          {initialFlowData?.key && !loading && (
            <div className=" flex-1 flex ">
              <FlowWrapper
                ref={flowRef}
                bgColor="rgb(100 116 139)"
                className="flex-1  w-full"
                initNodeList={initialFlowData.nodes}
                initEdgeList={initialFlowData.edges}
                compId={initialFlowData.key}
                showTollbar={false}
                showControls={false}
                showMiniMap={false}
                showBackground={false}
                getSelectableItems={getSelectableForFlowItem}
                onNodeListChange={updateNodes}
                onEdgeListChange={updateEdges}
              />
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
    </ReactFlowProvider>
  )
}

export default WordsDashboard
