// /src/components/AffixList.tsx
import React, { useState } from 'react'
import { Table, Button, Modal } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons' // 使用 ant-design 图标
import AffixForm from './AffixForm'

export type AffixType = {
  id?: string // 唯一标识符，必选
  key: number // 排序用的数字，必选
  type: 'prefix' | 'suffix' // 词缀类型，必选
  affix: string[] // 词缀数组，必选
  meaning: string // 词缀的含义，必选
  affectedPartsOfSpeech?: string[] // 影响的词性，选填
  examples?: string[] // 示例单词，选填
  origin?: string // 词缀的起源，选填
  variants?: string[] // 词缀的变体形式，选填
  commonCombinations?: string[] // 常见组合，选填
  grammarRules?: string // 语法规则，选填
  additionalInfo?: string // 其他附加信息，选填
}

interface AffixListProps {
  data: AffixType[]
  onEdit: (id: string, updatedAffix: AffixType) => void
  onDelete: (id: string) => void
  onAdd: (newAffix: AffixType) => void
}

const AffixList: React.FC<AffixListProps> = ({ data, onEdit, onDelete, onAdd }) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingAffix, setEditingAffix] = useState<AffixType | null>(null)

  const handleAddClick = () => {
    setEditingAffix(null)
    setIsModalVisible(true)
  }

  const handleEditClick = (affix: AffixType) => {
    setEditingAffix(affix)
    setIsModalVisible(true)
  }

  const handleDeleteClick = (id: string) => {
    onDelete(id)
  }

  const handleSave = (updatedAffix: AffixType) => {
    if (editingAffix?.id) {
      onEdit(editingAffix.id, updatedAffix)
    } else {
      onAdd(updatedAffix)
    }
    setIsModalVisible(false)
  }

  const columns = [
    { title: 'Key', dataIndex: 'key', key: 'key', width: 60 },
    {
      title: '词缀',
      dataIndex: 'affix',
      key: 'affix',
      width: 200,
      render: (_: any, record: AffixType) => {
        return record.affix.join('/')
      },
    },
    {
      title: '词性',
      dataIndex: 'affectedPartsOfSpeech',
      key: 'affix',
      width: 200,
      render: (_: any, record: AffixType) => {
        return record?.affectedPartsOfSpeech?.join('/')
      },
    },
    // { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '含义', dataIndex: 'meaning', key: 'meaning' },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: any, record: AffixType) => (
        <span>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
            style={{ marginRight: 8 }}
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteClick(record.id ? record.id : '')} // 修正强制解包问题
          />
        </span>
      ),
    },
  ]

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddClick}
        style={{ marginBottom: 16 }}
      >
        添加
      </Button>
      <Table dataSource={data} columns={columns} rowKey="key" size="small" />

      <Modal
        title={editingAffix ? '编辑词缀' : '添加词缀'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <AffixForm affix={editingAffix} onSave={handleSave} />
      </Modal>
    </div>
  )
}

export default AffixList
