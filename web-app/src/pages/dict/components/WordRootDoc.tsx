import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Select, Space, Spin } from 'antd'
import { GlobalWorkerOptions, PDFDocumentProxy, RenderTask, getDocument } from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { useDebounce, usePinchZoom } from '@/hooks/usePinchZoom'
import ModalForm from '@/components/modal/ModalForm'
import DocText, { DocTextItem } from './DocText'

const SOURCE_SERVICE_HOST = 'http://localhost:4000'

GlobalWorkerOptions.workerSrc = SOURCE_SERVICE_HOST + '/assets/worker/pdf.worker.min.mjs'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}
let renderTask: RenderTask | null = null

const WordRootDoc: React.FC<{ path: string }> = ({ path }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null) // Blob URL 用于显示 PDF
  const canvasRef = useRef<HTMLCanvasElement | null>(null) // 用于渲染 PDF 的 Canvas
  const [currentPage, setCurrentPage] = useState(1) // 当前页
  const [totalPages, setTotalPages] = useState(0) // 总页数
  const [isLoading, setIsLoading] = useState(false)
  const [isTextModalVisible, setIsTextModalVisible] = useState(false)
  const [currentText, setCurrentText] = useState<DocTextItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const previousScrollTopRef = useRef(0)

  const [zoom] = usePinchZoom()

  // 加载 PDF 文件
  const loadPDF = (file: File) => {
    const url = URL.createObjectURL(file) // 创建 Blob URL
    setPdfUrl(url)
    setCurrentPage(1) // 每次重新加载 PDF 时，重置到第一页
  }

  const renderPage = useCallback(
    async (pdf: PDFDocumentProxy, pageNum: number) => {
      setIsLoading(true)
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: zoom })
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')

      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        if (renderTask) {
          renderTask.cancel()
        }

        renderTask = page.render(renderContext)

        renderTask.promise
          .then(() => {
            renderTask = null
          })
          .catch(error => {
            // console.error('Error during render:', error)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    },
    [zoom],
  )

  const loadDocument = useCallback(() => {
    if (pdfUrl) {
      getDocument(pdfUrl).promise.then(pdf => {
        setTotalPages(pdf.numPages)
        renderPage(pdf, currentPage)
      })
    }
  }, [currentPage, pdfUrl, renderPage])

  useEffect(() => {
    if (!path) return
    ipcRenderer.invoke(IPC_ACTIONS.READ_STREAM, encodeURIComponent(path)).then((res: any) => {
      const blob = new Blob([res], { type: 'application/pdf' })
      loadPDF(blob as File)
    })
  }, [path])

  useEffect(() => {
    loadDocument()
  }, [loadDocument, zoom])

  useEffect(() => {
    loadDocument()
  }, [pdfUrl, currentPage, zoom, loadDocument])

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const threshold = 100
    const scrollTop = container.scrollTop // 当前滚动的高度
    const scrollHeight = container.scrollHeight // 内容的总高度
    const clientHeight = container.clientHeight // 容器的可视高度

    // 判断当前滚动方向
    const isScrollingDown = scrollTop > previousScrollTopRef.current // 向下滚动
    const isScrollingUp = scrollTop < previousScrollTopRef.current // 向上滚动

    // 更新之前的滚动位置
    previousScrollTopRef.current = scrollTop

    // 判断滚动是否到达底部或顶部
    const atBottom = scrollTop + clientHeight >= scrollHeight - threshold // 到达底部
    const atTop = scrollTop <= threshold // 到达顶部

    if (!isLoading) {
      // 向下滚动到达底部时翻页
      if (isScrollingDown && atBottom && currentPage < totalPages) {
        // 更新状态后，添加短时间内不重复翻页的逻辑
        setCurrentPage(prevPage => prevPage + 1)
        // 这里可以设置一个标志，防止短时间内重复翻页
      }
      // 向上滚动到达顶部时翻页
      else if (isScrollingUp && atTop && currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1)
      }
    }
  }, [currentPage, isLoading, totalPages])

  const extractTextFromPage = (pdf: PDFDocumentProxy, pageNum: number) => {
    pdf
      .getPage(pageNum)
      .then(page => {
        page
          .getTextContent()
          .then(textContent => {
            const textItems = textContent.items
              // eslint-disable-next-line no-control-regex
              .map((item: any) => item.str.replace(/[^\S\r\n]+/g, ' ').trim())
              .join(' ')
            // eslint-disable-next-line no-control-regex
            // const sanitizedTextItems = textItems.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim()
            console.log('textItems: ', textItems)
            // 你可以根据需要进行后续处理，比如正则匹配
            // const regex = /(\w+)\s*\[([^\]]+)\]\s*(\w+\.)\s*(.*?)(【词频\s*\d+】)?/g
            const regex = /([\w一-龥]+)\s*\[([^\]]+)\]\s*(\w+\.)\s*([^【]+)(?:【词频 (\d+)】)?/g

            let match
            const matches = []
            while ((match = regex.exec(textItems)) !== null) {
              matches.push({
                word: match[1], // 单词
                phonetic: match[2].replace(/\s/g, ''), // 音标
                partOfSpeech: match[3], // 词性
                definition: match[4], // 解释
                frequency: match[5] ? match[5] : null, // 词频（如果存在）
              })
            }
            setIsTextModalVisible(true)
            setCurrentText(matches)
          })
          .catch(error => {
            console.error('Error extracting text:', error)
          })
      })
      .catch(error => {
        console.error('Error getting page:', error)
      })
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleExtractText = () => {
    if (pdfUrl) {
      getDocument(pdfUrl).promise.then(pdf => {
        extractTextFromPage(pdf, currentPage)
      })
    }
  }

  // 使用防抖优化滚动事件

  // const debouncedHandleScroll = useDebounce(handleScroll, 800)
  const debouncedHandleScroll = useDebounce(() => {
    // 处理滚动事件的逻辑
    console.log('Scrolled')
    handleScroll()
  }, 100)
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', debouncedHandleScroll)
    }

    return () => {
      const container = containerRef.current
      if (container) {
        container.removeEventListener('scroll', debouncedHandleScroll)
      }
    }
  }, [debouncedHandleScroll])

  return (
    <div style={{ padding: '0', position: 'relative' }} className="page">
      <div
        ref={containerRef}
        style={{ height: 'calc(100vh - 100px)', width: 'max-content', margin: 'auto', overflow: 'auto' }}
      >
        <Spin spinning={isLoading}>
          <div style={{ minHeight: `calc(100vh + 50px ` }}>
            <canvas ref={canvasRef} className="flex-1" />
          </div>
        </Spin>
      </div>
      <div style={{ height: '50px' }}>
        {pdfUrl && (
          <Space>
            <Button onClick={goToPrevPage} disabled={currentPage === 1}>
              上一页
            </Button>
            <span style={{ margin: '0 10px' }}>
              {currentPage} / {totalPages}
            </span>
            <Button onClick={goToNextPage} disabled={currentPage === totalPages}>
              下一页
            </Button>
            <Button onClick={handleExtractText} disabled={currentPage === totalPages}>
              Get Current Text
            </Button>

            <Space>
              <span>Zoom In/out</span>
              <Select
                style={{ width: '100px' }}
                value={zoom}
                options={[
                  { value: '0.25', label: '0.25' },
                  { value: '0.5', label: '0.5' },
                  { value: '1', label: '1' },
                  { value: '1.25', label: '1.25' },
                  { value: '1.5', label: '1.5' },
                  { value: '1.75', label: '1.75' },
                  { value: '2', label: '2' },
                ]}
              ></Select>
            </Space>
          </Space>
        )}
      </div>

      <ModalForm
        visible={isTextModalVisible}
        Child={DocText}
        data={currentText}
        onClose={() => setIsTextModalVisible(false)}
        onSubmit={v => {
          console.log('submit: ', v)
        }}
      />
    </div>
  )
}

export default WordRootDoc
