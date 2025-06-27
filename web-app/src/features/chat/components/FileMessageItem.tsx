import React from 'react'
import { Image, Button, Tooltip } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { cn } from '@/lib/utils'

type FileMessageItemProps = {
  fileUrl: string
  fileName: string
  fileType: string
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.includes('word')) return '📝'
  if (type.includes('excel')) return '📊'
  if (type.includes('zip') || type.includes('rar')) return '🗜️'
  return '📎'
}

const FileMessageItem: React.FC<FileMessageItemProps & React.HTMLAttributes<HTMLDivElement>> = ({
  fileUrl,
  fileName,
  fileType,
  className,
  ...rest
}) => {
  const isImage = fileType.startsWith('image/')

  return (
    <div className={cn('max-w-xs break-words', className)} {...rest}>
      {isImage ? (
        <div className="space-y-1 relative">
          <Image
            src={fileUrl}
            alt={fileName}
            className="rounded-md border border-gray-300"
            style={{ maxHeight: 192 }} // 48px * 4
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 truncate max-w-[80%]">{fileName}</div>
            <Tooltip title="Download">
              <a href={fileUrl} download={fileName}>
                <Button type="text" size="small" icon={<DownloadOutlined />} className="text-blue-500" />
              </a>
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xl">{getFileIcon(fileType)}</span>
          <a
            href={fileUrl}
            download={fileName}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline text-sm"
          >
            {fileName}
          </a>
        </div>
      )}
    </div>
  )
}

export default FileMessageItem
