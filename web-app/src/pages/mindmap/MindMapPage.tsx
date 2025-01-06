// src/pages/MindMapPage.tsx
import React, { useCallback, useMemo, useState } from 'react'
import MindMapCanvas, { ExtendedNode } from '@/features/mindmap/components/FlowDiagram'
import { Edge, ReactFlowProvider } from 'react-flow-renderer'
import { Button, Splitter, Tabs, TabsProps, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const items: TabsProps['items'] = [
  {
    key: '1',
    label: 'Local',
    children: 'Recently opened file',
  },
  {
    key: '2',
    label: 'Cloud-based',
    children: 'Recently downloaded files from the cloud',
  },
]

type tag = {
  name: string
  selected: boolean
  nodes: ExtendedNode[]
  edges: Edge[]
}

const MindMapPage: React.FC = () => {
  const [tags, settags] = useState<tag[]>([
    {
      name: 'Default -1',
      selected: true,
      nodes: [],
      edges: [],
    },
  ])

  const currentTag = useMemo(() => {
    return tags.find(item => item.selected)
  }, [tags])

  const currentNodes = useMemo(() => {
    return currentTag?.nodes
  }, [currentTag?.nodes])
  const currentEdges = useMemo(() => {
    return currentTag?.edges
  }, [currentTag?.edges])

  const handleChange = (tagName: string) => {
    settags(tgs => {
      return tgs.map(t => {
        if (t.name === tagName) {
          return {
            ...t,
            selected: true,
          }
        }
        return {
          ...t,
          selected: false,
        }
      })
    })
  }

  const createNewTag = () => {
    settags(tgs => {
      return [
        ...tgs,
        {
          name: 'Default -' + (tgs.length + 1),
          selected: false,
          nodes: [],
          edges: [],
        },
      ]
    })
  }

  const updateEdges = (list: Edge[]) => {
    console.log('update edges', list)
  }
  const updateNodes = useCallback(
    (list: ExtendedNode[]) => {
      console.log('update nodes', list)
      console.log('currentTag::', currentTag)
      console.log('currentNodes::', currentNodes)
      if (currentTag) {
        return settags(tgs => {
          return tgs.map(tg => {
            if (tg.selected && tg.name === currentTag?.name) {
              return {
                ...tg,
                nodes: [...list],
              }
            }
            return tg
          })
        })
      }

      settags(tgs => {
        console.log('currentTag::', currentTag)
        const newTag = {
          name: 'Default -' + (tgs.length + 1),
          selected: true,
          nodes: [...list],
          edges: [],
        }
        return [...tgs, newTag]
      })
    },
    [currentNodes, currentTag],
  )

  return (
    <ReactFlowProvider>
      <Splitter style={{ height: '100vh', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        <Splitter.Panel defaultSize="20%" min="2%" max="40%">
          <div className=" p-2">
            <div className="flex flex-row justify-between">
              <Button>Save to Local</Button>
              <Button>Save to Cloud</Button>
            </div>
            <h2>Recent</h2>
            <Tabs defaultActiveKey="1" items={items} />
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div className=" flex flex-col" style={{ height: '100%' }}>
            <MindMapCanvas
              bgColor="#aaa"
              className="flex-1"
              nodeList={currentNodes!}
              edgeList={currentEdges!}
              onEdgeListChange={updateEdges}
              onNodeListChange={updateNodes}
            />
            <div
              style={{
                border: '1px solid #ddd',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'auto',
              }}
            >
              {tags.length > 0 &&
                tags.map(tag => (
                  <Tag
                    key={tag.name}
                    style={{ padding: '2px ' }}
                    color={currentTag?.name === tag.name ? 'blue' : 'default'}
                    onClick={() => handleChange(tag.name)}
                  >
                    {tag.name}
                  </Tag>
                ))}
              <PlusOutlined onClick={createNewTag} />
              <span>currentTag name:{currentTag?.name}</span>
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>
    </ReactFlowProvider>
  )
}

export default MindMapPage
