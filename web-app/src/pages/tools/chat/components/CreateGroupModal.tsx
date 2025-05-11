// 📁 src/pages/chat/components/CreateGroupModal.tsx
import React, { useState } from 'react'
import { Modal, Input } from 'antd'
import { sendMessage } from '@/features/chat/service/chatService'

const CreateGroupModal: React.FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [groupName, setGroupName] = useState('')

  const handleCreate = () => {
    // message.success(`创建群组成功：${groupName}`)
    sendMessage({
      type: 'group-create',
      group: {
        id: groupName,
        name: groupName,
        members: [],
        admin: '',
        messages: [],
      },
    })
    setGroupName('')
    onClose()
  }

  return (
    <Modal open={open} title="创建新群组" okText="创建" onCancel={onClose} onOk={handleCreate}>
      <Input placeholder="请输入群组名称" value={groupName} onChange={e => setGroupName(e.target.value)} />
    </Modal>
  )
}

export default CreateGroupModal
