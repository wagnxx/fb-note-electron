import React, { useState } from 'react'
import GoogleDrivePicker from '@/components/google/GoogleDrivePicker'
import PdfView from '@/components/docs/pdf/PdfViewer'
import googleDriveService from '@/utils/googleDriveApi'

const IndexPage = () => {
  const [files, setFiles] = useState<any[]>([]) // 当前文件夹内容
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null) // 当前PDF文件
  const [breadcrumb, setBreadcrumb] = useState<any[]>([]) // 用于保存目录路径

  const handlePick = async (item: any) => {
    if (item.mimeType === 'application/pdf') {
      const buffer = await googleDriveService.fetchFileAsArrayBuffer(item.id)
      setPdfBuffer(buffer)
      setFiles([]) // 清空文件夹视图
    } else if (item.mimeType === 'application/vnd.google-apps.folder') {
      const children = await googleDriveService.listFilesInFolder(item.id)
      setFiles(children)
      setPdfBuffer(null) // 清空 PDF 视图
      setBreadcrumb(prev => [...prev, item]) // 更新当前文件夹路径
    } else {
      setFiles([]) // 非文件夹和PDF类型清空文件夹内容
      setPdfBuffer(null)
    }
  }

  // 返回上一级文件夹
  const handleGoBack = async () => {
    const previousFolder = breadcrumb[breadcrumb.length - 2]
    if (previousFolder) {
      const children = await googleDriveService.listFilesInFolder(previousFolder.id)
      setFiles(children)
      setPdfBuffer(null) // 清空 PDF 视图
      setBreadcrumb(breadcrumb.slice(0, breadcrumb.length - 1)) // 返回上级目录
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Books</h2>
      <GoogleDrivePicker onPick={handlePick} />

      {/* 返回按钮，显示在有目录层级的情况下 */}
      {breadcrumb.length > 1 && (
        <button className="mt-4 text-blue-600 hover:underline" onClick={handleGoBack}>
          返回上级目录
        </button>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg">文件夹内容：</h3>
          <ul className="list-disc ml-6">
            {files.map(file => (
              <li
                key={file.id}
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => handlePick(file)}
              >
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pdfBuffer && (
        <div className="mt-6">
          <h3 className="text-lg">PDF 预览：</h3>
          <PdfView fileUrl={pdfBuffer} />
        </div>
      )}
    </div>
  )
}

export default IndexPage
