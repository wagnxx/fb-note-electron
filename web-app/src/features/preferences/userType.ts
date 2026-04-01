export type LocalUserType = 'developer' | 'toolUser' | 'writer' | 'relay'

export const LOCAL_USER_TYPES: Array<{
  key: LocalUserType
  label: string
  description: string
  startPath: string
}> = [
  {
    key: 'developer',
    label: '开发与系统调试',
    description: '适合研发/调试，保留完整菜单（系统、工具、测试与开发入口）。',
    startPath: '/system',
  },
  {
    key: 'toolUser',
    label: '效率工具用户',
    description: '面向高频工具使用：思维导图、文档处理、图片/视频、定位等。',
    startPath: '/tool',
  },
  {
    key: 'writer',
    label: '写作与内容整理',
    description: '聚焦写作工作流：写作列表、编辑、查看与存储目录设置。',
    startPath: '/tool/writing',
  },
  {
    key: 'relay',
    label: '中转站与通信',
    description: '聚焦 Relay 连接与协作通信入口。',
    startPath: '/tool/relay',
  },
]

export const DEFAULT_LOCAL_USER_TYPE: LocalUserType = 'toolUser'
