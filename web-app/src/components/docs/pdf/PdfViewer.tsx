import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import './PdfViewer.css'
import { Button, Select, Space } from 'antd'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import { TextContent } from 'pdfjs-dist/types/src/display/api'
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer.mjs'

// 设置 PDF.js worker
const SOURCE_SERVICE_HOST = 'http://localhost:4000'
GlobalWorkerOptions.workerSrc = SOURCE_SERVICE_HOST + '/assets/worker/pdf.worker.min.mjs'

const SLIDER_MAX = 64
const SLIDER_MIN = 0.1

const PdfViewer: React.FC<{
  fileUrl: string
  onExtractText?: (textContent: TextContent) => void
}> = ({ fileUrl, onExtractText }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map())

  const [totalPages, setTotalPages] = useState(0)
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set())
  const [scale, setScale] = usePinchZoom({ max: SLIDER_MAX, step: 0.5, min: SLIDER_MIN })

  // 加载 PDF
  useEffect(() => {
    if (!fileUrl) return
    getDocument(fileUrl).promise.then(pdf => {
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)
    })
  }, [fileUrl])

  // 监听滚动，更新可视页
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || !pdfRef.current) return

    const scrollTop = container.scrollTop
    const clientHeight = container.clientHeight
    const pageHeight = 800 * scale + 20

    const startPage = Math.max(1, Math.floor(scrollTop / pageHeight))
    const endPage = Math.min(totalPages, Math.ceil((scrollTop + clientHeight) / pageHeight))

    const newVisible = new Set<number>()
    for (let i = startPage - 2; i <= endPage + 2; i++) {
      if (i >= 1 && i <= totalPages) {
        newVisible.add(i)
      }
    }
    setVisiblePages(newVisible)
  }, [scale, totalPages])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 渲染单页（异步，支持多页并发）
  const renderPage = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d')
      if (!context || !pdfRef.current) return

      // 取消前一次渲染任务
      const prevTask = renderTasksRef.current.get(pageNum)
      if (prevTask) {
        prevTask.cancel()
        renderTasksRef.current.delete(pageNum)
      }

      const page = await pdfRef.current.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      const renderTask = page.render({
        canvasContext: context,
        viewport,
      })

      renderTasksRef.current.set(pageNum, renderTask)

      try {
        await renderTask.promise
        renderTasksRef.current.delete(pageNum)

        // 渲染文字层
        const textContent = await page.getTextContent()
        const textLayerDiv = canvas.parentElement?.querySelector('.textLayer')
        if (textLayerDiv) textLayerDiv.remove()

        const newTextLayerDiv = document.createElement('div')
        newTextLayerDiv.className = 'textLayer'
        const textLayer = new TextLayerBuilder({ pdfPage: page })
        textLayer.div = newTextLayerDiv
        textLayer.render(viewport, { textContent })

        canvas.parentElement?.appendChild(newTextLayerDiv)
      } catch (e) {
        // 被取消或出错
      }
    },
    [scale],
  )

  const handleExtractText = useCallback(() => {
    if (!pdfRef.current || !containerRef.current) return

    const scrollTop = containerRef.current.scrollTop
    const approxPage = Math.max(1, Math.floor((scrollTop + 100) / (800 * scale + 20)))

    pdfRef.current
      .getPage(approxPage)
      .then(page => page.getTextContent())
      .then(textContent => {
        onExtractText?.(textContent)
      })
      .catch(console.error)
  }, [onExtractText, scale])

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <Space style={{ padding: '10px' }}>
        <span>Zoom</span>
        <Select
          style={{ width: 100 }}
          value={scale}
          onChange={setScale}
          options={[0.25, 0.5, 1, 1.25, 1.5, 1.75, 2].map(v => ({ value: v, label: v.toString() }))}
        />
        <Button onClick={handleExtractText}>Get Current Text</Button>
      </Space>

      <div ref={containerRef} style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1
          const isVisible = visiblePages.has(pageNum)
          return (
            <div
              key={pageNum}
              style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', position: 'relative' }}
            >
              {isVisible ? (
                <div className="page-container">
                  <canvas
                    style={{ background: '#fff', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }}
                    ref={canvas => {
                      if (canvas) renderPage(pageNum, canvas)
                    }}
                  />
                </div>
              ) : (
                <div style={{ height: 800 * scale, width: 600 * scale, background: '#ccc' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PdfViewer
