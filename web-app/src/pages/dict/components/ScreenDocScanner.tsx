import { ModalChildProps, ModalChildRef } from '@/components/modal/ModalForm'
import { ScreenshotDocType } from '@/service/screenshotDoc'
import { shuffleColors } from '@/utils/utilsColor'
import { Empty, Image, Space, Tag } from 'antd'
import Title from 'antd/es/typography/Title'
import React, { forwardRef, useImperativeHandle, useState } from 'react'

const ScreenDocScanner = forwardRef<ModalChildRef, ModalChildProps<ScreenshotDocType>>(
  ({ onFinish, onClose, submitLoading, data }, ref) => {
    const [visible, setVisible] = useState(false)

    const shuffledColors = shuffleColors()

    useImperativeHandle(ref, () => ({
      resetFields: () => {},
    }))

    if (!data) return <Empty />

    return (
      <div>
        <Title>{data.docName}</Title>
        <div className=" pb-3">
          <Space>
            {data.keyTerms &&
              data.keyTerms.map((tg, index) => (
                <Tag
                  key={tg}
                  bordered={false}
                  color={shuffledColors[index % shuffledColors.length]}
                >
                  {tg}
                </Tag>
              ))}
          </Space>
        </div>
        <Image.PreviewGroup preview={{ visible, onVisibleChange: setVisible }}>
          {data.screenshots.map(item => (
            <Image key={item} src={item} width={100} height={180} />
          ))}
        </Image.PreviewGroup>
      </div>
    )
  },
)

export default ScreenDocScanner
