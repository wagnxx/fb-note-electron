import React from 'react'
import { Image } from 'antd'

interface FileMessageItemProps {
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

const FileMessageItem: React.FC<FileMessageItemProps> = ({ fileUrl, fileName, fileType }) => {
  const isImage = fileType.startsWith('image/')

  return (
    <div className="max-w-xs break-words">
      {isImage ? (
        <div className="space-y-1">
          <Image
            src={fileUrl}
            alt={fileName}
            className="rounded-md border border-gray-300"
            style={{ maxHeight: 192 }} // = 48px * 4
          />
          <div className="text-xs text-gray-500">{fileName}</div>
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
