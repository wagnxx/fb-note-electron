import { useNotification } from '@/hooks/useNotification'
import { converDocToImage, getFileInfo, parseDocFile, saveBase64ToImage } from '@/utils/utilsIpc'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Row, Space, Tabs, TabsProps } from 'antd'
import html2canvas from 'html2canvas'

import React, { useRef, useState } from 'react'
// eslint-disable-next-line no-undef
const mammoth = require('mammoth')

const DocToImageConverter = () => {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [docContent, setDocContent] = useState<string | null>(null)

  const [imageUrl, setImageUrl] = useState<string>('')

  const [loading, setLoading] = useState(false)

  const docContentRef = useRef<HTMLDivElement>(null)

  const { showNotification } = useNotification()

  const invokeParseFile = (f: string | ArrayBuffer) => {
    parseDocFile(f)
      .then((result: string) => {
        setDocContent(result) // 设置文档的文本内容
        setLoading(false)
      })
      .catch((err: Error) => {
        console.error('Error parsing file:', err)
        setLoading(false)
      })
  }

  const handleChooseFormElectron = async () => {
    const fileInfo = await getFileInfo('file')
    if (!fileInfo) return

    setFilePath(fileInfo.path)
    invokeParseFile(fileInfo.path)
  }

  // 请求 Electron 解析文件内容
  // const handleParseFile = async () => {
  //   if (file) {
  //     setLoading(true)
  //     invokeParseFile(await file.arrayBuffer())
  //   }
  // }

  const handleConvertToImageByCanvas = async () => {
    const element = docContentRef.current
    if (element) {
      try {
        // Type assertion to force the correct type handling
        // const canvas = (await (html2canvas(element) as unknown)) as HTMLCanvasElement
        const canvas = await html2canvas(element, {
          scale: 2, // 提高分辨率
          useCORS: true, // 启用 CORS 支持
        })

        // Now you can use canvas.toDataURL safely
        const imgUrl = canvas.toDataURL('image/png')

        console.log(imgUrl) // Log or use the generated image URL
        setImageUrl(imgUrl)
        // Handle the image URL (e.g., save it to state)
      } catch (error) {
        console.error('Error converting to image:', error)
      }
    }
  }

  const handleSaveImage = async () => {
    saveBase64ToImage({
      imageData: imageUrl,
      enPath: filePath ? encodeURIComponent(filePath.replace(/(\.docx?)$/, '.png')) : '',
    })
      .then(res => {
        if (res.success) {
          showNotification('success', `saved successfully, image path: "${res.filePath}"`, 'notification')
        } else {
          showNotification('success', res.message, 'notification')
        }
      })
      .catch(err => {
        console.log('save failed ', err)
        showNotification('success', err, 'notification')
      })
  }

  // 请求 Electron 转换为图片
  const handleConvertToImage = (isWeb: boolean = true) => {
    const handleFileConversion = (pt: string | ArrayBuffer) => {
      converDocToImage(pt)
        .then(res => {
          const blob = new Blob([res.arrayBuffer], { type: 'image/png' }) // 根据实际类型设置 MIME 类型

          // 创建临时 URL
          const imgUrl = URL.createObjectURL(blob)
          setImageUrl(imgUrl) // 更新转换后的图片 URL
          setLoading(false)
        })
        .catch((err: Error) => {
          console.error('Error converting to image:', err)
          setLoading(false)
        })
    }

    if (isWeb && file) {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer
        handleFileConversion(arrayBuffer)
      }
      reader.readAsArrayBuffer(file) // 将文件读取为 ArrayBuffer
    } else if (filePath) {
      handleFileConversion(encodeURIComponent(filePath))
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const { value } = await mammoth.convertToHtml({ arrayBuffer })
      console.log('HTML Content:', value)
      setDocContent(value)

      // const reader = new FileReader()
      // reader.onload = async e => {
      //   const arrayBuffer = e.target?.result
      //   console.log('File read as ArrayBuffer:', arrayBuffer)

      //   try {
      //     const { value } = await mammoth.convertToHtml({ arrayBuffer })
      //     console.log('HTML Content:', value)
      //     setDocContent(value)

      //   } catch (error) {
      //     console.error('Error parsing .docx file with mammoth:', error)
      //   }
      // }

      // reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error reading file:', error)
    }
  }

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Doc preview',
      children: (
        <div className=" p-3">
          <Row>
            <Space>
              <Button icon={<PlusOutlined />} onClick={handleChooseFormElectron}>
                Choose File
              </Button>

              <Button onClick={() => handleConvertToImageByCanvas()} disabled={loading}>
                convert by canvas
              </Button>
            </Space>
          </Row>
          <div>
            <h3>文档内容：</h3>
            <div ref={docContentRef} dangerouslySetInnerHTML={{ __html: docContent || '' }} />
          </div>
        </div>
      ),
    },

    {
      key: '3',
      label: 'Image preview web',
      disabled: !imageUrl,
      children: (
        <div className="page" style={{ height: 'calc(100vh - 30px)' }}>
          <Row className=" py-3">
            <Button onClick={handleSaveImage}>Save </Button>
          </Row>
          <div style={{ height: 'calc(100% - 100px)', overflow: 'auto' }}>
            <img src={imageUrl} />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className=" p-4">
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  )
}

export default DocToImageConverter
