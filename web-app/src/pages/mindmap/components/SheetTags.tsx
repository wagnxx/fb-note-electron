import { PlusOutlined } from '@ant-design/icons'
import { Input, Tag } from 'antd'
import React, { FC, useState } from 'react'
import { SheetTag } from '../MindMapPage'
import { useNotification } from '@/hooks/useNotification'

export type ChangeNameParams = {
  tagName: string
  newName: string
}

const SheetTags: FC<{
  tags: SheetTag[]
  currentTag?: SheetTag
  onSelectTag: (tagName: string) => void
  onAdd: () => void
  onChangeTagName?: (params: ChangeNameParams) => void
}> = ({ tags, currentTag, onSelectTag, onAdd, onChangeTagName }) => {
  const [editTagName, setEditTagName] = useState<string | null>(null)
  const [tempEditTagname, setTempEditTagname] = useState('')

  const { showNotification } = useNotification()

  const handleDbClickTag = (tagName: string) => {
    setEditTagName(tagName)
    setTempEditTagname(tagName)
  }
  const resetEditTagStatus = () => {
    setEditTagName(null)
    setTempEditTagname('')
  }
  const handleBlur = () => {
    if (!editTagName) return
    if (editTagName === tempEditTagname) return
    if (tags.some(tag => tag.name === tempEditTagname)) {
      showNotification('error', 'Cannot rename a sheet to the same name as another sheet.', 'message')
      setTempEditTagname(editTagName)
      return
    }

    const payload: ChangeNameParams = {
      tagName: editTagName,
      newName: tempEditTagname,
    }

    onChangeTagName?.(payload)
    resetEditTagStatus()
    console.log('payload data: ', payload)
  }
  return (
    <div className=" w-full flex items-center" style={{ border: '1px solid #ddd' }}>
      <div style={{ width: '30px', textAlign: 'center' }}>
        <PlusOutlined onClick={onAdd} />
      </div>
      <div
        className="flex items-center gap-1 p-1 box-border overflow-x-auto"
        style={{
          width: 'calc(100% - 30px)',
          height: '45px',
        }}
      >
        {tags.length > 0 &&
          tags.map(tag => (
            <Tag
              key={tag.name}
              style={{ padding: '2px ', margin: 0, cursor: 'pointer' }}
              color={currentTag?.name === tag.name ? 'blue' : 'default'}
              onClick={() => onSelectTag(tag.name)}
              onDoubleClickCapture={() => handleDbClickTag(tag.name)}
            >
              {editTagName === tag.name ? (
                <Input
                  value={tempEditTagname}
                  max={31}
                  maxLength={31}
                  style={{ width: 'fit-content', maxWidth: '110px', minWidth: '40px' }}
                  onChange={e => setTempEditTagname(e.target.value)}
                  onBlur={handleBlur}
                />
              ) : (
                tag.name
              )}
            </Tag>
          ))}
      </div>
    </div>
  )
}

export default SheetTags
