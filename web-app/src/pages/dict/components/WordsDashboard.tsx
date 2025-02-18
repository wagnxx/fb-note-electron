import { Button, Card, Input, List, Space } from 'antd'
import React, { FC, useMemo, useState } from 'react'
import { JsonItem } from '../Dict'

const WordsDashboard: FC<{
  rootItem: JsonItem | null
  // listData: WordType[]
}> = ({ rootItem }) => {
  const [keywords, setKeywords] = useState('')

  const listData =
    useMemo(() => {
      return rootItem?.group?.filter(item => item.name.includes(keywords)) || []
    }, [keywords, rootItem]) || []

  return (
    <>
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
        {rootItem && (
          <Space>
            <Input placeholder="enter keywords" value={keywords} onChange={e => setKeywords(e.target.value)} />
            <Button>Add</Button>
          </Space>
        )}
      </div>
      <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
        <List
          itemLayout="horizontal"
          dataSource={listData}
          rowKey={'name'}
          key={'name'}
          locale={{ emptyText: 'No root JSON file selected.' }}
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
    </>
  )
}

export default WordsDashboard
