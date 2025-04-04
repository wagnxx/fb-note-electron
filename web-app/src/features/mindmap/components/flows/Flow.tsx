import React, { useCallback, useEffect, useMemo, forwardRef, useImperativeHandle, useState, useRef, FC } from 'react'
import {
  ReactFlow,
  MiniMap,
  Edge,
  BackgroundVariant,
  useReactFlow,
  Background,
  EdgeAddChange,
  SelectionMode,
  PanOnScrollMode,
} from '@xyflow/react'
// 引入 uuid 库
import { v4 as uuidv4 } from 'uuid'
import { noop } from '@/utils/utilsMisc'

import Toolbar from '../tools/Toolbar'

import { useNotification } from '@/hooks/useNotification'
import useFirstRender from '@/hooks/useFirstRender'
import { ZoomSlider } from '@/components/lib/components/zoom-slider'
import '@xyflow/react/dist/style.css' // 关键修复点
import useRegisterKeypressCtrol from '../../hooks/useRegisterKeypressCtrol'
import useNodeOperaton from '../../hooks/useNodeOperaton'
import { CreateGroupNode, CustomItem, CustomNodeData, ExtendedNode, TopicTheme } from '../../types'
import LiteNode from '../nodes/LiteNode'
import ExNode from '../nodes/ExNode'
import { topoSortNodes } from '@/utils/utilsGraph'
import ExGroupNode from '../nodes/ExGroupNode'
import {
  defaultEdgeOptions,
  FREE_NODE_PREFIX,
  NODE_DISTANCE,
  NODE_HEIGHT,
  NODE_TYPES,
  NODE_WIDTH,
  NodeType,
} from '../../constants'

export type FlowProps = {
  bgVType?: BackgroundVariant
  bgColor?: string
  bgGap?: number
  bgSize?: number
  className?: string
  // nodeList: ExtendedNode[]
  // edgeList: Edge[]
  initNodeList: ExtendedNode[]
  initEdgeList: Edge[]
  // The property is only used to test。It is used in the effect function and the DEFAULT_NODES.
  compId: string
  showTollbar?: boolean
  showMiniMap?: boolean
  showControls?: boolean
  showBackground?: boolean
  readonly?: boolean
  topicTheme?: TopicTheme | null
  onNodeListChange?: (fn: (data: ExtendedNode[]) => ExtendedNode[]) => void
  onEdgeListChange?: (fn: (data: Edge[]) => Edge[]) => void
  getSelectableItems?: () => CustomItem[] // 从父组件获取选择项的函数
  onClickNode?: (data: ExtendedNode | null) => void
}

export type FlowDiagramRef = {
  handleAddRootNode: (rootName?: string) => void
  handleCreateFreeNode: (rootName?: string[]) => void
  handleCreateGroupNodes: (groups: CreateGroupNode[]) => void
  handleCleanCanvas: () => void
  handleAppendChildrenToParent: (id: string, names: string[]) => void
  // handleSetCurrentNodeTheme: (theme: TopicTheme) => void
}

const Flow = forwardRef<FlowDiagramRef, FlowProps>(
  (
    {
      bgVType = BackgroundVariant.Dots,
      bgColor = '#ddd',
      bgGap = 20,
      bgSize = 1,
      className = ' ',
      initNodeList,
      initEdgeList,
      compId,
      showTollbar = true,
      showMiniMap = true,
      showControls = true,
      showBackground = true,
      readonly = false,
      topicTheme = null,
      onNodeListChange = noop,
      onEdgeListChange = noop,
      onClickNode = noop,
      getSelectableItems,
    },
    ref,
  ) => {
    const { getZoom } = useReactFlow()
    const [selectedNodes, setSelectedNodes] = useState<ExtendedNode[]>([])
    const [selectedNode, setselectedNode] = useState<ExtendedNode | null>(null)

    const { showNotification } = useNotification()
    const isFirstRender = useFirstRender()
    const keyPressTargetRef = useRef<HTMLDivElement>(null)
    const showAllNoteRef = useRef<boolean>(false)

    const {
      nodes,
      edges,
      setNodes,
      setEdges,
      handleFlowStateChange,
      createNewNode,
      batchDelete,
      copyNode,
      addChildNode,
      updateChildrenPos,
      updateNodeData,
      updateNodeProps,
      deleteNode,
      toggleExpand,
      createGroupChanges,
      batchUpdateNodeProps,
      fixedHierarchy,
      onNodeDragStop,
      onNodeDrag,
      onGroupSelections,
      onError,
      alignNodesLinear,
      alignNodesVertical,
      alignNodesGrid,
    } = useNodeOperaton({
      readonly,
      initNodeList,
      initEdgeList,
      selectedNodes,
      initialNodeSize: { width: NODE_WIDTH, height: NODE_HEIGHT },
      nodeDistance: NODE_DISTANCE,
    })

    const rootId = compId

    const updateInnerState = useCallback(() => {
      setNodes(initNodeList)
      setEdges(initEdgeList)
    }, [initEdgeList, initNodeList, setEdges, setNodes])

    const setNodeItemTheme = useCallback(
      (theme: TopicTheme) => {
        if (!selectedNode) return
        updateNodeData(selectedNode.id, { topicTheme: theme })
      },
      [selectedNode],
    )

    const handleAddRootNode = useCallback(
      (rootName = 'root') => {
        if (nodes.length > 0) {
          showNotification('error', 'It is used to create root nodes.', 'message')
          return
        }

        // It  won't be used for now. It's only used for the root node.
        const DEFAULT_NODES = [createNewNode({ id: rootId, label: rootName, isRoot: true })]
        const changes: { item: ExtendedNode; type: 'add' }[] = DEFAULT_NODES.map(item => ({ item, type: 'add' }))
        handleFlowStateChange(changes, [])
      },
      [createNewNode, handleFlowStateChange, nodes.length, rootId, showNotification],
    )
    const handleCreateFreeNode = useCallback(
      (freeNames = ['free node']) => {
        // It  won't be used for now. It's only used for the root node.
        const DEFAULT_NODES = freeNames.map((newName, index) => {
          const col = Math.floor(index / 33) // ✅ 计算列索引
          const row = index % 33 // ✅ 计算行索引

          return createNewNode({
            id: FREE_NODE_PREFIX + uuidv4(),
            label: newName,
            position: {
              x: 600 + col * (NODE_WIDTH + NODE_DISTANCE.horizontal), // ✅ 每列递增
              y: 250 + row * NODE_HEIGHT, // ✅ 每行递增
            },
          })
        })
        const changes: { item: ExtendedNode; type: 'add' }[] = DEFAULT_NODES.map(item => ({ item, type: 'add' }))
        handleFlowStateChange(changes, [])
      },
      [createNewNode, handleFlowStateChange],
    )

    // only supporting  depth 2
    const handleCreateGroupNodes = useCallback(
      (groups: CreateGroupNode[]) => {
        const changes = groups.map(createGroupChanges)
        const changesNodes = changes.reduce<
          {
            item: ExtendedNode
            type: 'add'
          }[]
        >((pre, cur) => {
          return pre.concat(cur.nodes)
        }, [])
        const changesEdges = changes.reduce<EdgeAddChange[]>((pre, cur) => {
          return pre.concat(cur.edges)
        }, [])
        handleFlowStateChange(changesNodes, changesEdges)
      },
      [createGroupChanges, handleFlowStateChange],
    )

    const handleResetPos = useCallback(
      (parentId: string) => {
        const parentNode = nodes.find(n => n.id === parentId)
        if (!parentNode?.children?.length) return

        let newChildrenNodes = nodes.filter(node => (parentNode.children ?? []).includes(node.id))
        newChildrenNodes = updateChildrenPos(parentNode, newChildrenNodes)
        handleFlowStateChange(
          newChildrenNodes.map(item => ({ position: item.position, id: item.id, type: 'position' })),
          [],
        )
      },
      [handleFlowStateChange, nodes, updateChildrenPos],
    )

    const handleCleanCanvas = useCallback(() => {
      setNodes([])
      setEdges([])
    }, [setEdges, setNodes])

    const handleClickNode = (e: React.MouseEvent | null, node: ExtendedNode | null) => {
      if (e) {
        const isResizeControl = (e.target as HTMLElement).closest('.react-flow__resize-control')
        if (isResizeControl) return
      }

      setselectedNode(node)
      onClickNode(node)
    }

    function cmdAndCPressedFn() {}

    function cmdAndVPressedFn() {
      if (selectedNodes.length > 0) {
        console.log('start copy')
        const ids = selectedNodes.map(item => item.id)
        copyNode(ids)
      } else {
        showNotification('error', 'Copied stack is empty', 'message')
      }
    }

    const HandleFixedHierarchy = useCallback(
      (id: string, deep?: boolean) => {
        const updateNodes = fixedHierarchy(id, deep || false, [...nodes])
        console.log(
          'updateNodes: ',
          updateNodes.map(item => ({ id: item.id, name: item.data.label, parentId: item.parentId })),
        )
        batchUpdateNodeProps(updateNodes)
      },
      [batchUpdateNodeProps, fixedHierarchy, nodes],
    )

    const handleLogNodes = () => {
      console.log('handleLogNodes: ', nodes)
    }
    const handleToggleNoteVisibility = () => {
      showAllNoteRef.current = !showAllNoteRef.current
      handleFlowStateChange(
        nodes.map(item => ({
          id: item.id,
          type: 'replace',
          item: { ...item, data: { ...item.data, isNoteVisibility: showAllNoteRef.current } },
        })),
        [],
      )
    }

    useRegisterKeypressCtrol({
      readonly,
      cmdAndCPressedFn,
      cmdAndVPressedFn,
      // metaDeletePresseFn: batchDelete,
      targetRef: keyPressTargetRef,
    })

    useEffect(() => {
      if (topicTheme && selectedNode) {
        setNodeItemTheme(topicTheme)
      }
    }, [selectedNode, setNodeItemTheme, topicTheme])

    // notify parent component updated action
    useEffect(() => {
      if (isFirstRender || readonly) return
      onNodeListChange(() => nodes) // 传递最新的 `nodes` 到父组件
    }, [isFirstRender, nodes, onNodeListChange, readonly])
    useEffect(() => {
      if (isFirstRender || readonly) return
      onEdgeListChange(() => edges) // 传递最新的 `nodes` 到父组件
    }, [edges, isFirstRender, onEdgeListChange, readonly])

    useEffect(() => {
      if (!isFirstRender) {
        updateInnerState()
      }
      return () => {}
    }, [compId, isFirstRender, updateInnerState])

    useImperativeHandle(
      ref,
      () => ({
        handleAddRootNode,
        handleCreateFreeNode,
        handleCleanCanvas,
        handleAppendChildrenToParent: (id: string, newNames: string[]) => addChildNode(id, newNames),
        handleCreateGroupNodes,
        // handleSetCurrentNodeTheme: setNodeItemTheme,
      }),
      [addChildNode, handleAddRootNode, handleCleanCanvas, handleCreateFreeNode, handleCreateGroupNodes],
    )

    const nodeTypes: Record<NodeType, FC<any>> = useMemo(() => {
      const handleCustomNodeProps = (props: any) => ({
        ...props,
        readonly,
        getSelectableItems,
        onAddChild: (newNames: string[]) => addChildNode(props.id, newNames),
        onExpandToggle: (val?: boolean) => toggleExpand(props.id, val),
        onDelete: () => deleteNode([props.id]),
        updateNodeData: (data: Partial<CustomNodeData>) => updateNodeData(props.id, data),
        updateNodeProps: (data: Partial<ExtendedNode>) => updateNodeProps(props.id, data),
        onResetPos: () => handleResetPos(props.id),
        onFixedHierarchy: (deep: boolean) => HandleFixedHierarchy(props.id, deep),
      })

      return {
        [NODE_TYPES.CUSTOM]: (props: any) =>
          readonly ? <LiteNode {...handleCustomNodeProps(props)} /> : <ExNode {...handleCustomNodeProps(props)} />,
        [NODE_TYPES.GROUP]: (props: any) => (
          <ExGroupNode style={{ pointerEvents: 'all' }} {...handleCustomNodeProps(props)} />
        ),
      }
    }, [
      HandleFixedHierarchy,
      addChildNode,
      deleteNode,
      getSelectableItems,
      handleResetPos,
      readonly,
      toggleExpand,
      updateNodeData,
      updateNodeProps,
    ])

    const sortedNodes = useMemo(() => topoSortNodes(nodes.filter(n => !n.isHidden)), [nodes])

    const handleArrange = (type: 'line' | 'vertical' | 'grid') => {
      switch (type) {
        case 'line':
          alignNodesLinear()
          break
        case 'vertical':
          alignNodesVertical()
          break
        case 'grid':
          alignNodesGrid()
          break
        default:
          break
      }
    }

    return (
      <div style={{ position: 'relative', userSelect: 'none' }} className={className} ref={keyPressTargetRef}>
        {showTollbar && (
          <Toolbar
            onCreateRootNode={() => handleAddRootNode()}
            onCreateNode={() => handleCreateFreeNode()}
            onDelete={batchDelete}
            onLogNodes={handleLogNodes}
            onToggleNote={handleToggleNoteVisibility}
            onArrange={type => handleArrange(type)}
            onGroupSelections={onGroupSelections}
          />
        )}
        <ReactFlow
          nodes={sortedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={val => handleFlowStateChange(val, [])}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          // connectionLineStyle={connectionLineStyle}
          // connectionLineType={ConnectionLineType.SimpleBezier}
          onSelectionChange={selection => setSelectedNodes(selection.nodes)}
          onNodeClick={(e, node) => handleClickNode(e, node)}
          onPaneClick={() => handleClickNode(null, null)}
          onError={onError}
          onlyRenderVisibleElements={true}
          selectionMode={SelectionMode.Full} // 允许部分框选
          selectionOnDrag
          multiSelectionKeyCode="Shift" // 允许 Shift + 点击多选
          defaultEdgeOptions={defaultEdgeOptions}
          panOnScroll
          panOnScrollSpeed={0.5} // 控制滚动速度
          panOnScrollMode={PanOnScrollMode.Free} // 允许自由滚动（水平 & 垂直）
          zoomOnScroll={true}
          nodeDragThreshold={10}
          minZoom={0.2}
          maxZoom={5}
          proOptions={{
            hideAttribution: true,
          }}
          fitView={false}
        >
          {showBackground && (
            <Background variant={bgVType} color={bgColor} size={bgSize / getZoom()} gap={bgGap / getZoom()} />
          )}
          {showMiniMap && <MiniMap />}
          {showControls && <ZoomSlider position="top-left" />}、
        </ReactFlow>
      </div>
    )
  },
)

export default Flow
