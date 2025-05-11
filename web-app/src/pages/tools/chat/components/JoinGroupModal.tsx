// 📁 src/pages/chat/components/JoinGroupModal.tsx
import React, { useState } from 'react'
import { Modal, Input } from 'antd'

const JoinGroupModal: React.FC<{
  open: boolean
  onClose: () => void
  onJoin: (username: string) => void
  groupName: string
}> = ({ open, onClose, onJoin, groupName }) => {
  const [username, setUsername] = useState('')

  return (
    <Modal open={open} onCancel={onClose} onOk={() => onJoin(username)} okText="加入" title={`申请加入 ${groupName}`}>
      <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" />
    </Modal>
  )
}

export default JoinGroupModal
