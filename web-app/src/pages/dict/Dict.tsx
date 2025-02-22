import React, { useState } from 'react'
import WordsDashboard from './components/WordsDashboard'
import WordRootJsonMenu from './components/WordRootJsonMenu'

export type WordType = {
  name: string
  meaning: string
  structurare: string
  example?: string
  from?: string // 词源
  morphLink?: string[] // 结构相似的词
}
export type JsonItem = {
  name: string
  siblings?: string[]
  isPrefix: boolean
  isSuffix: boolean
  from: string
  extension: string
  group: WordType[]
}

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

const Dict = () => {
  const [rootItem, setrootItem] = useState<JsonItem | null>(null)

  const handleFetchDictItem = async ({ key }: { key: string }) => {
    ipcRenderer.invoke(IPC_ACTIONS.READ_STREAM, encodeURIComponent(key)).then((res: any) => {
      const decoder = new TextDecoder('utf-8')
      const jsonString = decoder.decode(res)
      const jsonData = JSON.parse(jsonString)
      setrootItem(jsonData[0])
    })
  }

  return (
    <div className="w-full flex bg-slate-100">
      <div style={{ position: 'fixed', zIndex: 10 }}>
        <WordRootJsonMenu onItemClick={handleFetchDictItem} rootLabel="Choose WordRoot Json File" />
      </div>
      {rootItem && <WordsDashboard rootItem={rootItem} />}
    </div>
  )
}

export default Dict
