// default config
export const NODE_WIDTH = 140
export const NODE_HEIGHT = 65
export const NODE_DISTANCE = {
  horizontal: 50,
  vertical: 20,
}

export const GROUP_NODE_GUTTER = 20
export const connectionLineStyle = { stroke: '#F6AD55', strokeWidth: 3 }
export const defaultEdgeOptions = {
  style: connectionLineStyle,
  // animated: true
  type: 'default',
}

export const NODE_TYPES = {
  // DEFAULT: 'default',
  CUSTOM: 'customNode',
  GROUP: 'customGroup',
  // INPUT: 'input',
  // OUTPUT: 'output',
} as const

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES] // 'customNode' | 'group'

export const GROUP_NODE_PREFIX = 'group_'
export const FREE_NODE_PREFIX = 'free_'
