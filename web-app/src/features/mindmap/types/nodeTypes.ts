import { TopicTheme } from './baseTypes'

export interface CustomNodeData extends Record<string, unknown> {
  label: string
  note?: string
  isExpanded: boolean
  isNoteVisibility?: boolean
  childCount?: number
  outWidth?: number
  outHeight?: number
  topicTheme?: TopicTheme
}
