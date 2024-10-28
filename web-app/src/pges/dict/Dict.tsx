import React, { useMemo, useState } from 'react'
import barJson from '@/assets/raw/dict/bar.json'
import rootson from '@/assets/raw/dict/root.json'
import { Button, Card, Col, Input, List, Row } from 'antd'

barJson.forEach(item => {
  rootson.root.push(item.name)
  rootson.data.push(item)
})

const Dict = () => {
  const [rootItemName, setrootItemName] = useState('')
  // const [rootItem, setrootItem] = useState('')

  const [keywords, setKeywords] = useState('')

  const rootItem = useMemo(() => {
    return rootson.data.find(item => item.name === rootItemName)
  }, [rootItemName])

  const listData =
    useMemo(() => {
      return rootItem?.group.filter(item => item.name.includes(keywords)) || []
    }, [keywords, rootItem]) || []

  return (
    <div className="w-full flex bg-slate-100">
      <div className=" flex-1 flex flex-col  shadow-md bg-slate-50 " style={{ height: '100vh' }}>
        <div className="flex-1">
          <div className=" flex-col flex">
            <h2 className=" font-semibold  bg-slate-200 p-2">Word Root list</h2>
            <Row>
              {rootson.root.map(item => {
                return (
                  <Col span={4} key={item}>
                    <Button
                      onClick={() => setrootItemName(item)}
                      type={item === rootItemName ? 'primary' : 'text'}
                    >
                      -{item}-
                    </Button>
                  </Col>
                )
              })}
            </Row>
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
                      {rootItem?.isPrefix && '-'}
                      {rootItem?.name}
                      {rootItem?.isSuffix && '-'}
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
          <Input
            placeholder="enter keywords"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
          />
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
                      <strong>{item.name}</strong>
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
