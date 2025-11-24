import React, { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Affix, Collapse, Space } from 'antd'
import ChatView from '@/features/chat/components/ChatView'
import DesktopOnly from '@/components/platform/DesktopOnly'
import { copyText } from '@/utils/utilsClipboard'
import { CopyOutlined } from '@ant-design/icons'
import { useNotification } from '@/hooks/useNotification'
import { getWifi } from '@/utils/utilsIpc'
import { useIsMobile } from '@/hooks/useIsMobile'

// eslint-disable-next-line no-undef
const port = process.env.REACT_APP_ENV === 'production' ? 4000 : 3000

// const ip = '192.168.100.199'
const createURL = (ip: string) => {
  const url = `http://${ip}:${port}/ulogi/tool/chat/web?ip=${ip}`
  return url
}

const ChatRoomPage: React.FC = () => {
  const [ip, setIp] = useState('')

  const isMobile = useIsMobile()

  const url = useMemo(() => {
    if (!ip) return ''
    return createURL(ip)
  }, [ip])

  const { handleRequestWithNotification } = useNotification()
  const handleCopy = () => {
    handleRequestWithNotification(async () => copyText(url), {
      successMessage: 'Copy successful',
      errorMessage: 'Copy failed',
      successField: null,
      errorField: null,
    })
  }

  useEffect(() => {
    getWifi().then(res => {
      if (res) {
        setIp(res)
      }
    })
  }, [])

  return (
    <div className="p-4 space-y-4">
      {/* 二维码展示 */}
      <Affix
        offsetTop={0}
        style={{ position: 'absolute', zIndex: '9000', background: '#fff', padding: '8px' }}
        className=" w-60"
      >
        <Collapse>
          <Collapse.Panel header="Scan to access on mobile" key="1">
            <h1 className="text-xl font-semibold">Chat Room</h1>
            <p className="text-sm text-gray-600 mb-2">扫码在手机访问：</p>
            <QRCodeSVG value={url} size={160} />
            <Space direction="vertical" className="mt-2  p-x-2">
              <span className="text-xs text-gray-500 break-all">{url}</span>
              <CopyOutlined onClick={handleCopy} />
            </Space>
          </Collapse.Panel>
        </Collapse>
      </Affix>

      {/* 聊天界面 */}
      <div className="mt-4 border-t pt-4">{ip && !isMobile && <ChatView ip={ip} />}</div>
    </div>
  )
}

export default () => <DesktopOnly children={<ChatRoomPage />} />
