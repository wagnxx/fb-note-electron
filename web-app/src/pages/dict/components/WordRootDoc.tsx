import React, { useState, useEffect, useRef } from 'react'
import { Button, Select, Space } from 'antd'
import { GlobalWorkerOptions, PDFDocumentProxy, RenderTask, getDocument } from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { RenderParameters } from 'pdfjs-dist/types/src/display/api'

const SOURCE_SERVICE_HOST = 'http://localhost:4000'

GlobalWorkerOptions.workerSrc = SOURCE_SERVICE_HOST + '/assets/worker/pdf.worker.min.mjs'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}
const WordRootDoc: React.FC<{ path: string }> = ({ path }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null) // Blob URL 用于显示 PDF
  const canvasRef = useRef<HTMLCanvasElement | null>(null) // 用于渲染 PDF 的 Canvas
  const [currentPage, setCurrentPage] = useState(1) // 当前页
  const [totalPages, setTotalPages] = useState(0) // 总页数
  const [zoom, setZoom] = useState(0.8)

  // 加载 PDF 文件
  const loadPDF = (file: File) => {
    const url = URL.createObjectURL(file) // 创建 Blob URL
    setPdfUrl(url)
    setCurrentPage(1) // 每次重新加载 PDF 时，重置到第一页
  }

  useEffect(() => {
    if (!path) return
    ipcRenderer.invoke(IPC_ACTIONS.READ_STREAM, encodeURIComponent(path)).then((res: any) => {
      const blob = new Blob([res], { type: 'application/pdf' })
      loadPDF(blob as File)

      /**
       * 因为 ArrayBuffer 被传递到 Web Worker 或其他地方并且被 transfer 了，或者是由于内存管理的特殊行为（比如引用传递时的副作用）
       */
      // if (res) {
      //   const pdfData = res
      //   const arrayBuffer = pdfData.buffer.slice(
      //     pdfData.byteOffset,
      //     pdfData.byteOffset + pdfData.byteLength,
      //   )

      //   setPdfUrl(arrayBuffer)
      // }
    })
  }, [path])

  useEffect(() => {
    loadDocument()
  }, [zoom])

  // 渲染指定页面
  let renderTask: RenderTask
  const renderPage = async (pdf: PDFDocumentProxy, pageNum: number) => {
    pdf.getPage(pageNum).then(page => {
      const viewport = page.getViewport({ scale: zoom })
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext: RenderParameters = {
          canvasContext: context,
          viewport: viewport,
        }

        try {
          if (renderTask) {
            renderTask.cancel()
          }
          renderTask = page.render(renderContext)
        } catch (error) {}

        // page.render({
        //   canvasContext: context,
        //   viewport: viewport,
        // })
      }
    })
  }

  // 加载 PDF 文档
  const loadDocument = () => {
    if (pdfUrl) {
      getDocument(pdfUrl).promise.then(pdf => {
        setTotalPages(pdf.numPages)
        renderPage(pdf, currentPage)
      })
    }
  }

  // 页面变化时重新渲染
  useEffect(() => {
    loadDocument()
  }, [pdfUrl, currentPage])

  // 提取 PDF 页面文本
  const extractTextFromPage = (pdf: PDFDocumentProxy, pageNum: number) => {
    pdf
      .getPage(pageNum)
      .then(page => {
        page
          .getTextContent()
          .then(textContent => {
            const textItems = textContent.items.map((item: any) => item.str).join(' ')
            // console.log('textItems : ', textItems)
            const regex = /(\w+)\s*\[([^\]]+)\]\s*(\w+\.)\s*(.*?)(【词频\s*\d+】)?/g

            const matches = []
            let match
            while ((match = regex.exec(textItems)) !== null) {
              matches.push({
                word: match[1], // 单词
                phonetic: match[2], // 音标
                partOfSpeech: match[3], // 词性
                definition: match[4], // 解释
                frequency: match[5] ? match[5] : null, // 词频（如果存在）
              })
            }

            console.log(matches)
          })
          .catch(error => {
            console.error('Error extracting text:', error)
          })
      })
      .catch(error => {
        console.error('Error getting page:', error)
      })
  }

  const handleExtractText = () => {
    if (pdfUrl) {
      getDocument(pdfUrl).promise.then(pdf => {
        extractTextFromPage(pdf, currentPage)
      })
    }
  }

  // 翻页功能
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

  return (
    <div style={{ padding: '0', position: 'relative', height: 'calc(100vh - 30px)' }}>
      <div style={{ height: 'calc(100% - 50px)', overflow: 'auto' }}>
        <canvas ref={canvasRef} className=" flex-1" />
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
                onChange={val => setZoom(val)}
              ></Select>
            </Space>
          </Space>
        )}
      </div>
    </div>
  )
}

export default WordRootDoc
