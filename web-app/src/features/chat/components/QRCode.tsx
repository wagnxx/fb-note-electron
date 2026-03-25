import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { CopyOutlined, LinkOutlined, MobileOutlined } from '@ant-design/icons'
import { Button, Divider, Space } from 'antd'
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
    <div className="w-[280px] rounded-[24px] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <MobileOutlined />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-semibold leading-none text-slate-900">Chat Room</h1>
          <p className="mt-2 text-sm text-slate-500">扫码即可在手机上快速访问当前聊天页面</p>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="flex justify-center rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
          <QRCodeSVG value={url} size={176} />
        </div>
      </div>

      <Divider className="!my-4" />

      <Space direction="vertical" size={10} className="w-full">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          <LinkOutlined />
          <span>Web Link</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600 break-all">
          {url}
        </div>
        <Button type="default" icon={<CopyOutlined />} className="!rounded-full" onClick={handleCopy}>
          复制链接
        </Button>
      </Space>
    </div>
  )
}
