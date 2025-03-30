import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 定义支持的属性类型
type PropertyType = 'string' | 'number' | 'boolean' | 'object' | 'array'

// 确保 `type` 和 `value` 类型一致
type GlobalProperty<T extends PropertyType> = {
  key: string
  type: T
  value: {
    string: string
    number: number
    boolean: boolean
    object: Record<string, unknown>
    array: unknown[]
  }[T]
}

type StrictGlobalProperties = GlobalProperty<PropertyType>[]

// **全局默认属性**
const GLOBAL_PROPERTIES: StrictGlobalProperties = [
  { key: 'showTollbar', type: 'boolean', value: true },
  { key: 'showMiniMap', type: 'boolean', value: true },
  { key: 'showControls', type: 'boolean', value: true },
  { key: 'showBackground', type: 'boolean', value: true },
  { key: 'readonly', type: 'boolean', value: false },
] satisfies StrictGlobalProperties

// **Redux State**
interface MindmapConfigState {
  globalSettings: StrictGlobalProperties
  isSiderOpend: boolean
}

// **初始 State**
const initialState: MindmapConfigState = {
  globalSettings: GLOBAL_PROPERTIES,
  isSiderOpend: true,
}

// **定义 Action 类型**
type GlobalSettingsAction =
  | { type: 'reset'; payload: StrictGlobalProperties }
  | { type: 'add'; payload: StrictGlobalProperties }
  | { type: 'change'; payload: Partial<GlobalProperty<PropertyType>>[] } // 👈 `change` 只允许部分字段

// **创建 Redux Slice**
const configSlice = createSlice({
  name: 'mindmapConfig',
  initialState,
  reducers: {
    updateGlobalSettings: (state, action: PayloadAction<GlobalSettingsAction>) => {
      switch (action.payload.type) {
        case 'reset':
          state.globalSettings = action.payload.payload
          break
        case 'add':
          state.globalSettings = [...state.globalSettings, ...action.payload.payload]
          break
        case 'change':
          state.globalSettings = state.globalSettings.map(item => {
            const changed = action.payload.payload.find(c => c.key === item.key)
            return changed ? { ...item, ...changed } : item // 仅更新提供的字段
          })
          break
      }
    },
    toggleIsSiderOpend: state => {
      state.isSiderOpend = !state.isSiderOpend
    },
  },
})

// **导出 Redux actions 和 reducer**
export const { updateGlobalSettings, toggleIsSiderOpend } = configSlice.actions
export default configSlice.reducer
