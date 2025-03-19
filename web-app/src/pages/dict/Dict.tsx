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
  const [fileOlder, setFileOlder] = useState(0)

  const handleFetchDictItem = async (opions: { key: string }) => {
    const { key } = opions

    ipcRenderer.invoke(IPC_ACTIONS.READ_STREAM, encodeURIComponent(key)).then((res: any) => {
      const decoder = new TextDecoder('utf-8')
      const jsonString = decoder.decode(res)
      const jsonData = JSON.parse(jsonString)
      setrootItem(jsonData[0])

      const reg = /\/(\d+)\..+$/
      const match = key.match(reg)
      if (match) {
        setFileOlder(Number(match[1]))
      } else {
        setFileOlder(0)
        console.log('No match found')
      }
    })
  }

  return (
    <div className="w-full flex bg-slate-100">
      <div style={{ position: 'fixed', zIndex: 10, left: '12px' }}>
        <WordRootJsonMenu onItemClick={handleFetchDictItem} rootLabel="Choose WordRoot Json File" />
      </div>
      {rootItem && <WordsDashboard key={rootItem.name} rootItem={rootItem} fileOlder={fileOlder} />}
    </div>
  )
}

export default Dict
