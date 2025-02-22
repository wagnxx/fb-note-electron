import { Card, Empty } from 'antd'
import React, { FC } from 'react'
import { JsonItem } from '../Dict'

const WordsDashboardHeader: FC<{ rootItem: JsonItem | null }> = ({ rootItem }) => {
  if (!rootItem) {
    return <Empty />
  }
  return (
    <Card>
      <Card.Meta
        title={
          <h1 className=" text-center">
            <span>
              {rootItem.isPrefix && '-'}
              {rootItem.name}
              {rootItem.isSuffix && '-'}
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
  )
}

export default WordsDashboardHeader
