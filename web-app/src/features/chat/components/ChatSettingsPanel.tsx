import React, { useEffect } from 'react'
import { Button, Descriptions, DescriptionsProps, Divider, Drawer, List, Tabs, TabsProps, Tag } from 'antd'
import { useAppSelector } from '@/store/hooks'
import { send, sendWithRes } from '@/features/chat/service/chatService'
import AvatarUploader from './AvatarUploader'
import UserListItem from './UserListItem'
import ChatGroupList from './ChatGroupList'
import { IdcardOutlined, ReloadOutlined, WifiOutlined } from '@ant-design/icons'

type ChatSettingsPanelProps = {
  open: boolean
  onClose: () => void
  onSelectGroup: (id: string) => void
}

const ChatSettingsPanel: React.FC<ChatSettingsPanelProps> = ({ open, onClose, onSelectGroup }) => {
  const { wsState, users } = useAppSelector(state => state.chat)

  // avoid repeated requests when panel rapidly re-renders; only request when opened and WS connected
  const lastSettingsReqRef = React.useRef<number | null>(null)
  useEffect(() => {
    if (!open) return
    if (!wsState.isConnected) return
    const now = Date.now()
    // throttle to 3s between requests from this panel
    if (lastSettingsReqRef.current && now - lastSettingsReqRef.current < 3000) return
    lastSettingsReqRef.current = now
    void sendWithRes('users-req', {}).catch(() => undefined)
    void sendWithRes('groups-req', {}).catch(() => undefined)
  }, [open, wsState.isConnected])

  const handleUpdateAvatar = (avatar: string) => {
    send('reset-user', { avatar, id: wsState.id })
  }

  const userDescItems: DescriptionsProps['items'] = [
    {
      key: '1',
      label: 'userName',
      children: wsState.username,
    },
    {
      key: '2',
      label: 'userId',
      children: wsState.id,
    },
    {
      key: '3',
      label: 'ws is connected',
      children: String(wsState.isConnected),
    },
  ]

  const tabItems: TabsProps['items'] = [
    {
      key: 'online-users',
      label: '在线用户',
      children: (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-800">在线用户</div>
              <div className="mt-1 text-xs text-slate-500">当前可见的聊天用户列表</div>
            </div>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              className="!rounded-full"
              onClick={() => void sendWithRes('users-req', {}).catch(() => undefined)}
            >
              刷新
            </Button>
          </div>
          <div className="max-h-72 overflow-auto custom-scrollbar pr-1">
            <List
              dataSource={users || []}
              renderItem={user => <UserListItem key={user.id} user={user} />}
              rowKey={'id'}
              split={false}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'group-plaza',
      label: '群组广场',
      children: <ChatGroupList onJoined={() => undefined} onSelectGroup={onSelectGroup} />,
    },
  ]

  return (
    <Drawer
      title="配置面板"
      width={380}
      open={open}
      onClose={onClose}
      placement="right"
      styles={{ body: { paddingTop: 10 } }}
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-4 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-300">Profile</div>
                <div className="mt-2 text-xl font-semibold">{wsState.username || '未设置昵称'}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-200">
                  <WifiOutlined />
                  <span>{wsState.isConnected ? '连接正常，可同步消息' : '当前离线，部分操作不可用'}</span>
                </div>
              </div>
              <Tag color={wsState.isConnected ? 'success' : 'default'} className="!mr-0 rounded-full px-3 py-1 text-xs">
                {wsState.isConnected ? '在线' : '离线'}
              </Tag>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-2 shadow-inner shadow-slate-100">
                <AvatarUploader
                  username={wsState.username}
                  avatar={wsState.avatar}
                  onUpdateAvatar={handleUpdateAvatar}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800">点击头像可更换个人形象</div>
                <div className="mt-1 text-xs leading-6 text-slate-500">让其他设备和群成员更容易识别你。</div>
              </div>
            </div>

            <Divider className="!my-4" />

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                <IdcardOutlined />
                <span>Identity</span>
              </div>
              <Descriptions items={userDescItems} column={1} size="small" className="chat-profile-descriptions" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-3 pt-2 shadow-sm shadow-slate-100/80">
          <Tabs items={tabItems} defaultActiveKey="online-users" className="chat-settings-tabs" />
        </div>
      </div>
    </Drawer>
  )
}

export default ChatSettingsPanel
