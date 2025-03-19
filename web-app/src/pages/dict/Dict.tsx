import React from 'react'
import WordsDashboard from './components/WordsDashboard'

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

const Dict = () => {
  return (
    <div className="w-full flex bg-slate-100">
      <WordsDashboard />
    </div>
  )
}

export default Dict
