import React, { useState, useEffect, useRef } from 'react'
import 'pdfjs-dist/web/pdf_viewer.css'

import { getDocument } from 'pdfjs-dist'
// eslint-disable-next-line no-undef
const { PDFViewer, EventBus } = require('pdfjs-dist/web/pdf_viewer')
const { ipcRenderer, IPC_ACTIONS } = window.electron || {}
const PDFViewerDoc: React.FC<{ path: string }> = ({ path }) => {
  const viewerRef = useRef<HTMLDivElement | null>(null) // 引用容器元素
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!path) return
    ipcRenderer.invoke(IPC_ACTIONS.READ_STREAM, encodeURIComponent(path)).then((res: any) => {
      const blob = new Blob([res], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob) // 创建 Blob URL
      setPdfUrl(url)
    })
  }, [path])
  useEffect(() => {
    if (!path || !viewerRef.current || !pdfUrl) return // 确保路径和容器存在

    const eventBus = new EventBus() // 创建 EventBus 实例

    const pdfViewer = new PDFViewer({
      container: viewerRef.current, // 传递容器给 PDFViewer
      eventBus: eventBus, // 必须传递 eventBus
      textLayerMode: 2, // 启用文本层，2 是启用文本选择和复制
    })

    getDocument(pdfUrl).promise.then(pdf => {
      pdfViewer.setDocument(pdf) // 加载并显示 PDF
    })
  }, [path, pdfUrl])

  return (
    <div
      ref={viewerRef}
      style={{
        position: 'absolute', // 必须设置为绝对定位
        top: 0,
        left: 0,
        width: '100%', // 宽度设置为 100%
        height: '100vh', // 高度设置为视口高度
      }}
    />
  )
}

export default PDFViewerDoc
