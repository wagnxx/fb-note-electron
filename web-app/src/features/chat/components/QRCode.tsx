import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { CopyOutlined } from '@ant-design/icons'
import { Space } from 'antd'
import { QRCodeSVG } from 'qrcode.react'
import React, { useMemo } from 'react'

// eslint-disable-next-line no-undef
const port = process.env.REACT_APP_ENV === 'production' ? 4000 : 3000

export default function QRCode({ ip }: { ip: string }) {
  const createURL = (ip: string) => {
    const url = `http://${ip}:${port}/ulogi/tool/chat/web?ip=${ip}`
    return url
  }
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

  return (
    <div>
      <h1 className="text-xl font-semibold">Chat Room</h1>
      <p className="text-sm text-gray-600 mb-2">扫码在手机访问：</p>
      <QRCodeSVG value={url} size={160} />
      <Space direction="vertical" className="mt-2  p-x-2">
        <span className="text-xs text-gray-500 break-all">{url}</span>
        <CopyOutlined onClick={handleCopy} />
      </Space>
    </div>
  )
}
