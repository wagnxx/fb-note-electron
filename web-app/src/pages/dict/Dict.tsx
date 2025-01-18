import React, { useMemo, useState } from 'react'
import { Card, Input, List } from 'antd'
import WordRootJsonMenu from './components/WordRootJsonMenu'

type WordType = {
  name: string
  meaning: string
  structurare: string
  example?: string
  from?: string // 词源
  morphLink?: string[] // 结构相似的词
}
type JsonItem = {
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
  const [rootItemName, setrootItemName] = useState('')
  const [rootItem, setrootItem] = useState<JsonItem | null>(null)

  const [keywords, setKeywords] = useState('')

  const listData =
    useMemo(() => {
      return rootItem?.group?.filter(item => item.name.includes(keywords)) || []
    }, [keywords, rootItem]) || []

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
      <div className=" flex-1 flex flex-col  shadow-md bg-slate-50 " style={{ height: '100vh' }}>
        <div className="flex-1">
          <div className=" flex-col flex">
            <h2 className=" font-semibold  bg-slate-200 p-2">Word Root list</h2>
            <WordRootJsonMenu onItemClick={handleFetchDictItem} />
          </div>
        </div>
        <div className="flex-1">
          <h2 className=" font-semibold  bg-slate-200 p-2">Affix</h2>
          <div className=" flex-1">
            <h2 className=" p-2">-em</h2>
          </div>
        </div>
      </div>
      {/* word list */}
      <div className="flex-1 px-2">
        {/* <Divider /> */}
        <div className="flex flex-col " style={{ height: '200px' }}>
          <div className="flex-1" style={{ overflow: 'auto' }}>
            {rootItem && (
              <Card>
                <Card.Meta
                  title={
                    <h1 className=" text-center">
                      <span>
                        {rootItem?.isPrefix && '-'}
                        {rootItem?.name}
                        {rootItem?.isSuffix && '-'}
                      </span>
                      {rootItem.siblings?.length &&
                        rootItem.siblings
                          .filter(sb => sb !== rootItem.name)
                          .map(sb => (
                            <span key={sb}>
                              ,{rootItem?.isPrefix && '-'}
                              {sb}
                              {rootItem?.isSuffix && '-'}
                            </span>
                          ))}
                    </h1>
                  }
                  description={
                    <>
                      <p style={{ paddingLeft: '2em', textIndent: '-2em' }}>
                        <strong>【词源】</strong>
                        <span style={{ fontSize: '0.8em' }}>{rootItem?.from}</span>
                      </p>
                      <p style={{ paddingLeft: '2em', textIndent: '-2em' }}>
                        <strong>【引申】</strong>
                        <span style={{ fontSize: '0.8em' }}>{rootItem?.extension}</span>
                      </p>
                    </>
                  }
                ></Card.Meta>
              </Card>
            )}
          </div>
          <Input placeholder="enter keywords" value={keywords} onChange={e => setKeywords(e.target.value)} />
        </div>
        <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <List
            itemLayout="horizontal"
            dataSource={listData}
            rowKey={'name'}
            key={'name'}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div className="flex gap-2">
                      <div>
                        <strong>{item.name}</strong>
                      </div>
                      <span className=" text-gray-800">{item.meaning}</span>
                    </div>
                  }
                  description={`【${item.structurare}】`}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default Dict
