import { ModalChildProps, ModalChildRef } from '@/components/modal/ModalForm'
import FlowWrapper from '@/features/mindmap/components/flows/FlowWrapper'
import { ExtendedNode } from '@/features/mindmap/types'
import { CloudMindFile } from '@/pages/mindmap/components/TabpanelCloud'
import { Tabs, TabsProps } from 'antd'
import React, { forwardRef } from 'react'
import ReactJson from 'react-json-view'
// import yaml from 'js-yaml'
// eslint-disable-next-line no-undef
const yaml = require('js-yaml')

interface SimplifiedNode {
  label: string
  note?: string
  children?: SimplifiedNode[]
}
interface NestedNode extends ExtendedNode {
  childrenNodes?: NestedNode[]
}

const buildTree = (nodes: ExtendedNode[]): NestedNode[] => {
  const nodeMap = new Map<string, NestedNode>()

  // 先把所有节点放入 Map，方便查找
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, childrenNodes: [] })
  })

  const roots: NestedNode[] = []

  nodes.forEach(node => {
    if (node.children?.length) {
      const parent = nodeMap.get(node.id)
      node.children.forEach(childId => {
        const childNode = nodeMap.get(childId)
        if (childNode) {
          parent?.childrenNodes?.push(childNode)
        }
      })
    }
  })

  // 找到根节点（可能多个）
  nodes.forEach(node => {
    if (node.isRoot || !nodes.some(n => n.children?.includes(node.id))) {
      roots.push(nodeMap.get(node.id)!)
    }
  })

  return roots
}

const buildSimplifiedTree = (nodes: ExtendedNode[]): SimplifiedNode[] => {
  const nodeMap = new Map<string, SimplifiedNode>()

  // 初始化节点映射，只保留需要的字段
  nodes.forEach(node => {
    nodeMap.set(node.id, { label: node.data.label, note: node.data.note, children: [] })
  })

  const roots: SimplifiedNode[] = []

  nodes.forEach(node => {
    if (node.children?.length) {
      const parent = nodeMap.get(node.id)
      node.children.forEach(childId => {
        const childNode = nodeMap.get(childId)
        if (childNode) {
          parent?.children?.push(childNode)
        }
      })
    }
  })

  // 找到根节点（未被其他节点引用的）
  nodes.forEach(node => {
    if (!nodes.some(n => n.children?.includes(node.id))) {
      roots.push(nodeMap.get(node.id)!)
    }
  })

  return roots
}

const WordFlow = forwardRef<ModalChildRef, ModalChildProps<CloudMindFile>>(
  ({ onFinish, onClose, submitLoading, data }, ref) => {
    const mindData = data?.data[0]

    if (!mindData) return <div>-</div>

    const wordJson = buildSimplifiedTree(mindData.nodes)

    const items: TabsProps['items'] = [
      {
        key: '1',
        label: 'Flow',
        children: (
          <div className="flex  flex-col" style={{ height: '100%', paddingBottom: '20px' }}>
            <FlowWrapper
              className="flex-1  bg-gray-600"
              initNodeList={mindData.nodes}
              initEdgeList={mindData.edges}
              compId={data.name}
              showMiniMap={false}
              showControls={false}
              showBackground={false}
              showTollbar={false}
              readonly
            />
          </div>
        ),
      },
      {
        key: '2',
        label: 'Word Json',
        children: (
          <ReactJson
            src={wordJson}
            theme="monokai" // 主题样式
            collapsed={false} // 默认展开
            enableClipboard={true} // 允许复制 JSON
            displayDataTypes={false} // 是否显示数据类型
          />
        ),
      },
      {
        key: '4',
        label: 'Word Yaml',
        children: (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              background: 'rgb(39, 40, 34)',
              color: 'rgb(253, 151, 31)',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {yaml.dump(yaml.dump(wordJson))}
          </div>
        ),
      },
    ]
    return <Tabs defaultActiveKey="1" items={items} style={{ height: '800px' }} />
  },
)

export default WordFlow
