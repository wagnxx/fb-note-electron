import React, { useState, useEffect } from 'react'
import 'pdfjs-dist/web/pdf_viewer.css'
import ModalForm from '@/components/modal/ModalForm'
import DocText, { DocTextItem } from './DocText'
import { TextContent } from 'pdfjs-dist/types/src/display/api'
import PdfViewer from '@/components/docs/pdf/PdfViewer'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

const WordRootDoc: React.FC<{ path: string }> = ({ path }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null) // Blob URL 用于显示 PDF
  const [isTextModalVisible, setIsTextModalVisible] = useState(false)
  const [currentText, setCurrentText] = useState<DocTextItem[]>([])

  useEffect(() => {
    if (!path) return
    ipcRenderer.invoke(IPC_ACTIONS.READ_STREAM, encodeURIComponent(path)).then((res: any) => {
      setPdfUrl(res)
    })
  }, [path])

  const extractTextFromPage = async (textContent: TextContent) => {
    try {
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
    } catch (error) {
      console.error('Error extracting text:', error)
    }
  }

  return (
    <div style={{ paddingBottom: '20px', height: 'calc(100vh - 30px)', background: '#eee' }} className="page">
      {pdfUrl && <PdfViewer fileUrl={pdfUrl} onExtractText={extractTextFromPage} />}

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
