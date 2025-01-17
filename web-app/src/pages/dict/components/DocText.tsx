import { ModalChildProps, ModalChildRef } from '@/components/modal/ModalForm'
import { Empty, List } from 'antd'
import React, { forwardRef } from 'react'

export type DocTextItem = {
  word: string
  phonetic: string
  partOfSpeech: string
  definition: string
  frequency: string | null
}

const DocText = forwardRef<ModalChildRef, ModalChildProps<DocTextItem[]>>(({ data }, ref) => {
  if (!data?.length) {
    return <Empty />
  }
  return (
    <div>
      <List
        dataSource={data}
        renderItem={item => (
          <div className="flex gap-4">
            <strong>{item.word}</strong>
            <em>|{item.phonetic}|</em>

            <span>
              <span>{item.partOfSpeech}</span>
              {item.definition}
            </span>

            {item.frequency && <span>【{item.frequency}】</span>}
          </div>
        )}
      />
    </div>
  )
})

export default DocText
