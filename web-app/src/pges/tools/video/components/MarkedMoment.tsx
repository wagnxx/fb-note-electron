import { formatSecondsToHHmmss } from '@/utils/utilsDate'
import { Button, Space, Tag, Tooltip } from 'antd'
import Title from 'antd/es/typography/Title'
import React, { FC, useEffect } from 'react'

type Props = {
  data?: number[]
  onPreview: (value: number | null) => void
  onJumpTo: (tm: number, shouldPlay: boolean) => void
}

const MarkedMoment: FC<Props> = ({ data, onPreview, onJumpTo }) => {
  useEffect(() => {
    console.log('Marked moment component update')
  }, [])
  return (
    <div>
      <Title level={3}>marked moment</Title>
      {!data?.length ? (
        <p>No mared moments</p>
      ) : (
        <div className=" pb-4">
          <Space onMouseLeave={() => onPreview(null)}>
            {data.map(tm => (
              <Tooltip
                placement="top"
                title={
                  <div className=" p-2">
                    <Space>
                      <Button onClick={() => onPreview(tm)}>Preview</Button>
                      <Button onClick={() => onJumpTo(tm, false)}>Jump To</Button>
                    </Space>
                  </div>
                }
              >
                <Tag color="cyan">{formatSecondsToHHmmss(tm)}</Tag>
              </Tooltip>
            ))}
          </Space>
        </div>
      )}
    </div>
  )
}

export default MarkedMoment
