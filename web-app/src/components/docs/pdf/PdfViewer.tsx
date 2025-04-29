import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { Button, Select, Space } from 'antd'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import { TextContent } from 'pdfjs-dist/types/src/display/api'

// 设置 PDF.js worker
const SOURCE_SERVICE_HOST = 'http://localhost:4000'

GlobalWorkerOptions.workerSrc = SOURCE_SERVICE_HOST + '/assets/worker/pdf.worker.min.mjs'
let renderTask: RenderTask | null = null

const SLIDER_MAX = 64
const SLIDER_MIN = 0.1
const PdfViewer: React.FC<{ fileUrl: string; onExtractText?: (textContent: TextContent) => void }> = ({
  fileUrl,
  onExtractText,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
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
    const pageHeight = 800 * scale + 20 // 每页高度（假设标准 800px 高，含 margin）

    const startPage = Math.max(1, Math.floor(scrollTop / pageHeight))
    const endPage = Math.min(totalPages, Math.ceil((scrollTop + clientHeight) / pageHeight))

    const pages = new Set<number>()
    for (let i = startPage - 2; i <= endPage + 2; i++) {
      if (i >= 1 && i <= totalPages) {
        pages.add(i)
      }
    }
    setVisiblePages(pages)
  }, [scale, totalPages])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll()
    }
    return () => {
      container?.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // 渲染单页
  const renderPage = useCallback(
    (pageNum: number, canvas: HTMLCanvasElement) => {
      if (renderTask) {
        renderTask.cancel() // 取消当前正在进行的渲染任务
      }

      if (!canvas) return

      pdfRef?.current?.getPage(pageNum).then(page => {
        const context = canvas.getContext('2d')
        if (!context) return

        const viewport = page.getViewport({ scale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        renderTask = page.render(renderContext) // 新的渲染任务
        renderTask.promise
          .then(() => {
            renderTask = null
          })
          .catch(error => {
            // console.error('Error during render:', error)
          })
          .finally(() => {
            // setIsLoading(false)
          })
      })
    },
    [scale],
  )

  const handleExtractText = useCallback(() => {
    if (!pdfRef.current) return

    // 计算当前页
    const container = containerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const clientHeight = container.clientHeight

    // 获取每一页的实际高度
    const pageHeightPromises = []
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pagePromise = pdfRef.current.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale })
        return viewport.height + 20 // 加上 margin
      })
      pageHeightPromises.push(pagePromise)
    }

    // 等待所有页面的高度计算完成
    Promise.all(pageHeightPromises).then(pageHeights => {
      const currentVisiblePage = Math.max(1, Math.floor((scrollTop + 100) / pageHeights[0]))

      pdfRef
        .current!.getPage(currentVisiblePage + 1)
        .then(page => {
          page.getTextContent().then(textContent => onExtractText?.(textContent))
        })
        .catch(error => {
          console.error('Error getting page:', error)
        })
      // 提取当前页文本
      // onExtractText?.(pdfRef.current!, currentVisiblePage + 1)
    })
  }, [onExtractText, scale, totalPages])

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Space style={{ padding: '10px' }}>
        <span>Zoom In/out</span>
        <Select
          style={{ width: '100px' }}
          value={scale}
          onChange={val => setScale(val)}
          options={[
            { value: 0.25, label: '0.25' },
            { value: 0.5, label: '0.5' },
            { value: 1, label: '1' },
            { value: 1.25, label: '1.25' },
            { value: 1.5, label: '1.5' },
            { value: 1.75, label: '1.75' },
            { value: 2, label: '2' },
          ]}
        ></Select>
        <Button onClick={handleExtractText}>Get Current Text</Button>
      </Space>

      <div ref={containerRef} style={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1
          return (
            <div
              key={pageNum}
              style={{
                margin: '10px 0',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {visiblePages.has(pageNum) ? (
                <canvas
                  ref={canvas => {
                    if (canvas) {
                      renderPage(pageNum, canvas)
                    }
                  }}
                  style={{ background: '#fff', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }}
                />
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
