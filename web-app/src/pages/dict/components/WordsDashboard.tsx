import { Button, Input, Row, Space, Splitter } from 'antd'
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { JsonItem } from '../Dict'
import SelectableList from '@/components/list/SelectableList'
import WordsDashboardHeader from './WordsDashboardHeader'
import WordProcessing from './WordProcessing'
import { TabItem } from '@/pages/mindmap/components/MindMapCanvasContainer'
import { ReactFlowProvider } from 'react-flow-renderer'
import FlowDiagram, { FlowDiagramRef } from '@/features/mindmap/components/FlowDiagram'
import { createMindFile, getMindFile } from '@/service/mind'
import { useNotification } from '@/hooks/useNotification'

type FlowData = TabItem

const WordsDashboard: FC<{
  rootItem: JsonItem
  fileOlder: number
}> = ({ rootItem, fileOlder }) => {
  const [keywords, setKeywords] = useState('')
  const [selections, setSelections] = useState<string[]>([])
  const [pendingWords, setPendingWords] = useState<string[]>([])
  const [flowData, setFlowData] = useState<FlowData>({
    key: rootItem.name,
    name: rootItem.name,
    nodes: [],
    edges: [],
  })
  const [selectedTag, setSelectedTag] = useState<string[]>([])
  const [tarNodeId, settarNodeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [isShowMeaning, setIsShowMeaning] = useState(true)
  const flowRef = useRef<FlowDiagramRef>(null)

  const { handleRequestWithNotification, showNotification } = useNotification()

  const listData =
    useMemo(() => {
      const data = rootItem?.group?.filter(item => item.name.includes(keywords)) || []
      return data.map(item => ({
        ...item,
        id: item.name,
        disabled: flowData.nodes.some(n => n.data.label === item.name),
      }))
    }, [flowData.nodes, keywords, rootItem?.group]) || []

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
        return
      }
      if (data.length > 1) {
        showNotification('error', `There are multiple ${filename} files, please check them.`, 'message')
        setFlowData(defaultData)
        return
      }
      setFlowData(data[0].data[0])
      console.log('getMindFile Data : ', data)
    },
    [rootItem.name, showNotification],
  )

  const handleSaveAsNew = async (): Promise<boolean> => {
    const params = {
      name: rootItem.name,
      data: [flowData],
      order: fileOlder,
    }

    await handleRequestWithNotification(async () => createMindFile(params), {
      successField: null,
      successMessage: 'Saved successfully',
    })

    return true
  }

  const handleListSelecte = (selectedKeys: string[]) => {
    setSelections(selectedKeys)
  }

  const getSelectableForFlowItem = () => selections.map(word => ({ label: word, value: word }))

  const handleCreateRootNode = () => {
    flowRef.current?.handleAddRootNode(rootItem.name)
  }
  const handleCreateFreeNode = () => {
    flowRef.current?.handleCreateFreeNode(selectedTag)
  }
  const handleCleanCanvas = () => {
    flowRef.current?.handleCleanCanvas()
  }
  const handleAppendChildrenToParent = () => {
    flowRef.current?.handleAppendChildrenToParent(tarNodeId, selectedTag)
  }

  useEffect(() => {
    if (!rootItem.name) return
    getFlowDataByName(rootItem.name)
  }, [getFlowDataByName, rootItem.name])

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
              onChange={handleListSelecte}
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
                <Button onClick={handleCreateRootNode} color="default">
                  Create Root Node
                </Button>
                <Button onClick={handleCreateFreeNode}>Create Free Node</Button>
                <Button onClick={handleCleanCanvas} danger>
                  Clean Canvas
                </Button>
                <Button onClick={handleSaveAsNew} danger>
                  Save Cloud
                </Button>
                <Button onClick={handleTestGetFlowData} danger>
                  Test Get Current Data
                </Button>
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
                onNodeListChange={listFn => setFlowData(pre => ({ ...pre, nodes: [...listFn(pre.nodes)] }))}
                onEdgeListChange={listFn => setFlowData(pre => ({ ...pre, edges: [...listFn(pre.edges)] }))}
              />
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
    </ReactFlowProvider>
  )
}

export default WordsDashboard
