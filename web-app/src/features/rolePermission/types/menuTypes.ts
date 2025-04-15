// menuTypes.ts

// 原始数据结构：保存的数据
export interface SystemMenuItem {
  id: string
  label: string
  key: string
  permissions: string[]
  parentId: string | null
  order: number
}

// 编辑用的数据结构：适用于表单
export interface EditableMenuItem {
  id: string
  label: string
  key: string
  permissions: string[]
  parentId?: string | null
}
