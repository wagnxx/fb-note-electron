import { Card, Checkbox } from 'antd'
import React, { FC } from 'react'
import { Snap } from '../MultiDocSnap'
import DocSortedItem from './DocSortedItem'

type Prop = {
  snap: Snap
  selectedKeys: Set<string>
  onHandleImageLoad: (name: string, event: React.SyntheticEvent<HTMLImageElement>) => void
  onHandlePreview: (snap: Snap) => void
  onHandleCheckboxChange: (val: boolean, id: string) => void
}

const DocCardItem: FC<Prop> = ({
  snap,
  selectedKeys,
  onHandleCheckboxChange,
  onHandlePreview,
  onHandleImageLoad,
}) => {
  return (
    <Card
      hoverable
      cover={
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '50.58%', // 高度是宽度的 607/1200 = 50.58%
            background: '#000',
          }}
        >
          <img
            crossOrigin={snap.isRemote ? '' : 'anonymous'}
            alt={snap.name}
            src={
              snap.isRemote
                ? snap.path
                : `http://localhost:4000/image?src=/${encodeURIComponent(snap.path)}`
            }
            onLoad={e => onHandleImageLoad(String(snap.path), e)}
            onClick={() => onHandlePreview(snap)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover', // 保证图片等比缩放并覆盖整个区域
            }}
          />
          <DocSortedItem item={snap} />
        </div>
      }
      style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}
    >
      <Card.Meta
        title={snap.name}
        description={
          <div>
            <Checkbox
              checked={selectedKeys.has(snap.path)}
              onChange={val => onHandleCheckboxChange(val.target.checked, snap.path)}
            />
          </div>
        }
      />
    </Card>
  )
}

export default DocCardItem
