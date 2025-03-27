import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { SelectableWordType } from './WordsDashboard'
import { Tree, TreeProps } from 'antd'
type TreeListProps = {
  data: SelectableWordType[]
  onUpdate?: (updateFn: (...args: any[]) => SelectableWordType[]) => void
}

type NodeType = SelectableWordType & {
  key: string
  children?: NodeType[]
}

export default forwardRef<TreeListRef, TreeListProps>(({ data = [], onUpdate = () => {} }, ref) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])

  const [treeData, setTreeData] = useState<NodeType[]>([])

  const filterTreeByCheckedKeys = useCallback(
    (nodes: NodeType[], checkedKeys: Set<string>, flatten = false): (NodeType & { children?: string[] })[] => {
      return nodes
        .map(node => {
          const isChecked = checkedKeys.has(node.id)

          // 递归过滤子节点
          const filteredChildren = node.children
            ? filterTreeByCheckedKeys(node.children, checkedKeys, flatten)
            : undefined

          // 只有当节点被选中，或它的子节点中至少有一个被选中时，才保留该节点
          if (isChecked || (filteredChildren && filteredChildren.length > 0)) {
            return {
              ...node,
              checked: isChecked,
              children: flatten
                ? filteredChildren?.map(child => child.id) // `children` 只包含 `id`
                : filteredChildren?.length
                  ? filteredChildren
                  : undefined, // 嵌套模式时返回完整子节点，children 为空时返回 `undefined`
            }
          }

          return null // 该节点不保留
        })
        .filter(Boolean) as (NodeType & { children?: string[] })[] // 过滤掉 null
    },
    [],
  )

  const onExpand: TreeProps['onExpand'] = expandedKeysValue => {
    console.log('onExpand', expandedKeysValue)
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    setExpandedKeys(expandedKeysValue)
    // setAutoExpandParent(false)
  }

  const onCheck: TreeProps['onCheck'] = checkedKeysValue => {
    console.log('onCheck', checkedKeysValue)
    setCheckedKeys(checkedKeysValue as React.Key[])
    if (Array.isArray(checkedKeysValue)) {
      const nodes = checkedKeysValue
        .map(key => {
          const node = data.find(n => n.id === key)
          return node
        })
        .filter(Boolean) as SelectableWordType[]
      onUpdate(() => nodes)
    }
  }

  const onSelect: TreeProps['onSelect'] = (selectedKeysValue, info) => {
    console.log('onSelect', info)
    setSelectedKeys(selectedKeysValue)
  }

  const onDrop: TreeProps<NodeType>['onDrop'] = info => {
    const { node, dragNode, dropToGap } = info
    const dragKey = dragNode.key as string
    const dropKey = node.key as string

    let draggedNode: NodeType | undefined

    // 1. 递归删除拖拽的节点
    const removeNode = (nodes: NodeType[], key: string): NodeType[] => {
      return nodes.reduce<NodeType[]>((acc, item) => {
        if (item.id === key) {
          draggedNode = item
          return acc
        }

        const newChildren = removeNode(item.children || [], key)

        acc.push({
          ...item,
          children: newChildren, // 直接传递，类型已经兼容
        })

        return acc
      }, [])
    }

    let updatedTree = removeNode([...treeData], dragKey)

    // 2. 处理 drop 逻辑
    if (!dropToGap) {
      // 拖拽到目标节点内部
      const insertNode = (nodes: NodeType[], key: string): NodeType[] => {
        return nodes.map(item => {
          if (item.id === key) {
            return { ...item, children: [...(item.children || []), draggedNode!] } as NodeType
          }
          if (item.children) {
            return { ...item, children: insertNode(item.children, key) } as NodeType
          }
          return item
        })
      }
      updatedTree = insertNode(updatedTree, dropKey)
    } else {
      // 拖拽到目标节点的兄弟节点之间
      const insertAtParent = (nodes: NodeType[], key: string): NodeType[] => {
        return nodes.reduce<NodeType[]>((acc, item) => {
          if (item.id === key) {
            return [...acc, draggedNode!, item]
          }
          if (item.children) {
            return [...acc, { ...item, children: insertAtParent(item.children, key) }]
          }
          return [...acc, item]
        }, [])
      }
      updatedTree = insertAtParent(updatedTree, dropKey)
    }

    setTreeData(updatedTree)
  }

  const handleGetNestCheckedKeys = useCallback(() => {
    const nest = filterTreeByCheckedKeys(treeData, new Set(checkedKeys as string[]), false)
    const flat = filterTreeByCheckedKeys(treeData, new Set(checkedKeys as string[]), true)
    return {
      nest,
      flat,
    }
  }, [checkedKeys, filterTreeByCheckedKeys, treeData])

  useEffect(() => {
    const tData = data
      .map((item: SelectableWordType) => ({
        ...item,
        key: item.id, // 为 SelectableWordType 添加 key 属性
      }))
      .reduce<NodeType[]>((pre, cur) => {
        if (pre.some(item => item.id === cur.id)) {
          return pre
        }
        return pre.concat(cur)
      }, [] as NodeType[])

    setTreeData(tData)
  }, [data])

  useImperativeHandle(
    ref,
    () => ({
      getCheckedNodes: handleGetNestCheckedKeys,
    }),
    [handleGetNestCheckedKeys],
  )

  return (
    <div>
      <Tree
        checkable
        multiple
        draggable
        defaultExpandAll
        treeData={treeData}
        fieldNames={{ title: 'name', key: 'id' }}
        expandedKeys={expandedKeys}
        checkedKeys={checkedKeys}
        selectedKeys={selectedKeys}
        onSelect={onSelect}
        onCheck={onCheck}
        onExpand={onExpand}
        onDrop={onDrop}
      />
    </div>
  )
})

export type TreeListRef = {
  getCheckedNodes: () => { nest: NodeType[]; flat: NodeType[] }
}
