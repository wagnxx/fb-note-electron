import { Edge, Node } from '@xyflow/react'
import { CustomNodeData } from './nodeTypes'

export interface ExtendedNode extends Node<CustomNodeData> {
  isRoot?: boolean
  isHidden?: boolean
  children?: string[]
}

export type CustomItem = {
  label: string
  value: string
}

export type CreateGroupNode = {
  name: string
  children?: CreateGroupNode[]
}

export type TabItem = {
  key: string
  name: string
  nodes: ExtendedNode[] // 添加节点数据
  edges: Edge[] // 添加边数据
}

export type SheetTag = {
  name: string
  selected?: boolean
  nodes: ExtendedNode[]
  edges: Edge[]
}
export type StoragedFile = {
  name: string
  path?: string
  id?: string
  lastModified: number
  data?: TabItem[]
  order?: number
}
