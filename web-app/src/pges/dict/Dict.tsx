import React, { useState } from 'react'
import barJson from '@/assets/raw/dict/bar.json'
import { Divider, List } from 'antd'

const Dict = () => {
  const [rootItem, setrootItem] = useState(barJson[0])
  return (
    <div className="w-full">
      {/* <div>Dict page</div> */}
      <h2 className=" px-2">-{rootItem.name}-</h2>
      <Divider />
      <div className=" flex-1 p-2" style={{ height: 'calc(100vh - 100px)', overflow: 'auto' }}>
        <List
          itemLayout="horizontal"
          dataSource={rootItem.group}
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
  )
}

export default Dict
