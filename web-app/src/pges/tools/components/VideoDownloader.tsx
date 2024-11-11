import React, { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Slider,
  List,
  Layout,
  Row,
  Col,
  Space,
  Typography,
  notification,
} from 'antd'

import { v4 as uuidv4 } from 'uuid'
import './VideoDownloader.css'

const { ipcRenderer } = window.electron
const { TextArea } = Input
const { Title } = Typography

interface DownloadItem {
  id: string
  name: string
  progress: string
  path: string
  isDownloading: boolean
}

const VideoDownloader: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [downloadDir, setDownloadDir] = useState('')
  const [downloadList, setDownloadList] = useState<DownloadItem[]>([])

  const [notificationApi, notificationContextHolder] = notification.useNotification()

  useEffect(() => {
    const savedPlayList = localStorage.getItem('playList')
    if (savedPlayList) {
      setDownloadList(JSON.parse(savedPlayList))
    }
  }, [])

  const startDownload = () => {
    if (!videoUrl || !downloadDir) {
      notification.error({
        message: 'Error',
        description: 'Please provide both video URL and download directory',
      })
      return
    }

    const videoId = uuidv4()
    const newDownloadItem = {
      id: videoId,
      name: `Video_${videoId}`,
      progress: '0%',
      path: '',
      isDownloading: true,
    }

    setDownloadList(prevList => {
      const updatedList = [...prevList, newDownloadItem]
      localStorage.setItem('playList', JSON.stringify(updatedList))
      return updatedList
    })

    ipcRenderer.send('start-download', { videoUrl, downloadDir, videoId })
  }

  const handleSelectDirectory = async () => {
    const selectedDir = await ipcRenderer.invoke('select-file', { type: 'directory' })
    if (selectedDir?.path) {
      setDownloadDir(selectedDir.path)
    }
  }

  useEffect(() => {
    ipcRenderer.on('download-title', ({ videoId, videoTitle }) => {
      if (!videoId || !videoTitle) {
        console.error('Invalid download title data:', { videoId, videoTitle })
        return
      }
      setDownloadList(prevList => {
        const updatedList = prevList.map(item => {
          if (item.id === videoId) {
            return { ...item, name: videoTitle }
          }
          return item
        })
        localStorage.setItem('playList', JSON.stringify(updatedList))
        return updatedList
      })
    })

    ipcRenderer.on('download-progress', ({ videoId, progress, path }) => {
      if (!videoId || !progress) {
        console.error('Invalid download progress data:', { videoId, progress })
        return
      }
      setDownloadList(prevList => {
        const updatedList = prevList.map(item => {
          if (item.id === videoId) {
            return { ...item, progress, path }
          }
          return item
        })
        localStorage.setItem('playList', JSON.stringify(updatedList))
        return updatedList
      })
    })

    ipcRenderer.on('download-complete', ({ videoId, path }) => {
      if (!videoId || !path) {
        console.error('Invalid download complete data:', { videoId, path })
        return
      }
      setDownloadList(prevList => {
        const updatedList = prevList.map(item => {
          if (item.id === videoId) {
            return { ...item, isDownloading: false, progress: '100%', path }
          }
          return item
        })
        localStorage.setItem('playList', JSON.stringify(updatedList))
        return updatedList
      })
      notification.success({ message: 'Download complete', description: `Video saved at: ${path}` })
    })

    ipcRenderer.on('download-error', ({ videoId, errorMessage }) => {
      if (!videoId || !errorMessage) {
        console.error('Invalid download error data:', { videoId, errorMessage })
        return
      }
      setDownloadList(prevList => {
        const updatedList = prevList.map(item => {
          if (item.id === videoId) {
            return { ...item, isDownloading: false, progress: 'Error' }
          }
          return item
        })
        localStorage.setItem('playList', JSON.stringify(updatedList))
        return updatedList
      })
      notification.error({ message: 'Download failed', description: errorMessage })
    })
  }, [])

  const playVideo = (path: string) => {
    console.log(`Playing video: ${path}`)
  }

  const addToPlayList = (path: string) => {
    notificationApi.success({
      message: 'Added to Playlist',
      description: `Video added: ${path}`,
    })
  }

  const deleteDownload = (videoId: string) => {
    setDownloadList(prevList => {
      const updatedList = prevList.filter(item => item.id !== videoId)
      localStorage.setItem('playList', JSON.stringify(updatedList))
      return updatedList
    })
  }

  const retryDownload = (videoId: string) => {
    const downloadItem = downloadList.find(item => item.id === videoId)
    if (!downloadItem) return

    const newDownloadItem = {
      ...downloadItem,
      progress: '0%',
      isDownloading: true,
    }

    setDownloadList(prevList => {
      const updatedList = prevList.map(item => (item.id === videoId ? newDownloadItem : item))
      localStorage.setItem('playList', JSON.stringify(updatedList))
      return updatedList
    })

    ipcRenderer.send('start-download', { videoUrl, downloadDir, videoId })
  }

  return (
    <Layout className="container">
      {notificationContextHolder}
      <div className="card">
        <Title className="section-title">Video Downloader</Title>
        <Row gutter={16}>
          <Col span={24}>
            <Input
              className="input-group"
              placeholder="Enter video URL"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />
          </Col>
          <Col span={24}>
            <Input
              className="input-group"
              placeholder="Select download directory"
              value={downloadDir}
              readOnly
            />
          </Col>
          <Col span={24}>
            <Space>
              <Button onClick={handleSelectDirectory}>Select Directory</Button>
              <Button
                className="styled-button"
                onClick={startDownload}
                disabled={!downloadDir || downloadList.some(item => item.isDownloading)}
              >
                {downloadList.some(item => item.isDownloading)
                  ? 'Downloading...'
                  : 'Start Download'}
              </Button>
            </Space>
          </Col>
        </Row>
        <List
          className="list-header"
          header={<div>Download List</div>}
          bordered
          dataSource={downloadList}
          renderItem={item => (
            <List.Item key={item.id}>
              <Row align="stretch" style={{ width: '100%' }}>
                {/* Meta 信息部分 */}
                <Col sm={24} md={12}>
                  <List.Item.Meta title={item.name} description={`Progress: ${item.progress}`} />
                  {item.isDownloading && (
                    <Slider
                      className="list-item-slider"
                      value={parseFloat(item.progress)}
                      max={100}
                      disabled
                    />
                  )}
                </Col>

                {/* 按钮部分 */}
                <Col sm={24} md={12}>
                  <div className="list-actions">
                    <Button
                      onClick={() => playVideo(item.path)}
                      disabled={item.isDownloading}
                      block
                    >
                      Play
                    </Button>
                    <Button
                      onClick={() => addToPlayList(item.path)}
                      disabled={item.isDownloading}
                      block
                    >
                      Add to Playlist
                    </Button>
                    <Button onClick={() => deleteDownload(item.id)} block>
                      Delete
                    </Button>
                    {item.progress !== '100%' && !item.isDownloading && (
                      <Button onClick={() => retryDownload(item.id)} block>
                        Retry Download
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </List.Item>
          )}
        />
      </div>
    </Layout>
  )
}

export default VideoDownloader
