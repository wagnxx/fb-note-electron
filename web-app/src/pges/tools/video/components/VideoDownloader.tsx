import React, { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Slider,
  List,
  Row,
  Col,
  Space,
  Typography,
  Select,
  Checkbox,
  Tooltip,
  Divider,
} from 'antd'

import { v4 as uuidv4 } from 'uuid'
import './VideoDownloader.css'
import { useNotification } from '@/hooks/useNotification'
import useFirstRender from '@/hooks/useFirstRender'
import {
  ArrowLeftOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { PlayItem } from './FileUpload'
import { setPlaylist } from '@/features/video/videoPlayer'
import { selectPlaylist } from '@/features/video/selectors'
import PageScroll from '@/components/layout/PageScroll'
import TitleBar from '@/components/layout/TitleBar'
import { useNavigate } from 'react-router-dom'
import useQueryParams from '@/hooks/useQueryParams'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}
const { TextArea } = Input
const { Title } = Typography

interface DownloadItem {
  id: string
  name: string
  progress: string
  path: string
  isDownloading: boolean
  downloadDir?: string
  videoRemoteUrl?: string
}

const VideoDownloader: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [downloadDir, setDownloadDir] = useState('')
  const [downloadList, setDownloadList] = useState<DownloadItem[]>([])
  const [dirHistoryList, setDirHistoryList] = useState<string[]>([])
  const [selections, setSelections] = useState<string[]>([])

  const dispatch = useDispatch()

  const updatePlaylists = (action: PlayItem[] | ((data: PlayItem[]) => PlayItem[])) =>
    dispatch(setPlaylist(action))

  const playlist = useSelector(selectPlaylist)
  const isInPlaylist = (itemId: string) => {
    return playlist.some(item => item.url === itemId)
  }

  const { notification: notificationApi } = useNotification()

  const isFirstRender = useFirstRender()
  const navigate = useNavigate()
  const { from: actionFrom } = useQueryParams()

  const handleBack = () => {
    actionFrom === 'button' && navigate(-1)
  }

  const dispatchDownloaAction = ({
    videoRemoteUrl,
    downloadDir,
    id,
  }: Pick<DownloadItem, 'videoRemoteUrl' | 'downloadDir' | 'id'>) => {
    if (!videoRemoteUrl || !downloadDir || !id) {
      notificationApi.warning({
        message: 'Parameters videoRemoteUrl, downloadDir, and id are all required.',
      })
      return
    }
    ipcRenderer.send('start-download', {
      videoUrl: videoRemoteUrl,
      enDownloadDir: encodeURIComponent(downloadDir),
      videoId: id,
    })
  }

  const handleDownload = () => {
    if (!videoUrl || !downloadDir) {
      notificationApi.error({
        message: 'Error',
        description: 'Please provide both video URL and download directory',
      })
      return
    }

    setDirHistoryList(prevList => {
      const curDirHistoryList = prevList.includes(downloadDir)
        ? prevList
        : [...prevList, downloadDir]
      return curDirHistoryList
    })

    const videoId = uuidv4()
    const newDownloadItem: DownloadItem = {
      id: videoId,
      name: `Video_${videoId}`,
      progress: '0%',
      path: '',
      isDownloading: true,
      videoRemoteUrl: videoUrl,
      downloadDir,
    }

    setDownloadList(prevList => {
      const updatedList = [...prevList, newDownloadItem]
      return updatedList
    })

    dispatchDownloaAction({ videoRemoteUrl: videoUrl, downloadDir, id: videoId })
  }

  const handleSelectDirectory = async () => {
    const selectedDir = await ipcRenderer.invoke('select-file', { type: 'directory' })
    if (selectedDir?.path) {
      setDownloadDir(selectedDir.path)
    }
  }
  const handleResume = (item: DownloadItem) => {
    console.log(`resume download video: `, item)
    if (!item.id) return
    dispatchDownloaAction({
      videoRemoteUrl: item.videoRemoteUrl,
      downloadDir: item.downloadDir,
      id: item.id,
    })
  }
  const handleToggleResume = (item: DownloadItem) => {
    if (!item.id) return
    console.log(`handleToggleResume video: `, item)
    if (item.isDownloading) {
      ipcRenderer.invoke(IPC_ACTIONS.PAUSE_DOWNLOAD, item.id).then((res: boolean) => {
        console.log('puased state:', res)
        if (res) {
          toggleItemResume(item, true)
        }
      })
    } else {
      ipcRenderer.invoke(IPC_ACTIONS.RESUME_DOWNLOAD, item.id).then((res: boolean) => {
        console.log('puased state:', res)
        if (res) {
          toggleItemResume(item, false)
        }
      })
    }
  }

  const toggleItemResume = (tar: DownloadItem, toPaused: boolean) => {
    setDownloadList(prevList =>
      prevList.map(item => {
        if (item.id === tar.id) {
          item.isDownloading = toPaused ? false : true
        }
        return item
      }),
    )
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    const currentSelections = new Set(selections)
    if (checked) {
      currentSelections.add(id)
    } else {
      currentSelections.delete(id)
    }

    setSelections([...currentSelections])
  }

  const handleSetAsCompleted = async () => {
    console.log(selections)
    if (!selections.length) return

    setDownloadList(prevList =>
      prevList.map(item => {
        if (selections.includes(item.id)) {
          item.isDownloading = false
          item.progress = '100%'
        }
        return item
      }),
    )
  }

  const handleResetPath = async (tar: DownloadItem) => {
    const file = await ipcRenderer.invoke(IPC_ACTIONS.SELECT_FILE, { type: 'file' })
    if (file.path) {
      setDownloadList(prevList =>
        prevList.map(item => {
          if (tar.id === item.id) {
            item.path = file.path
          }
          return item
        }),
      )
      notificationApi.success({ message: 'operation successfuly' })
    }
  }

  const addToPlayList = (item: DownloadItem) => {
    // console.log('item', item)
    updatePlaylists(prevList => [
      ...prevList,
      { url: item.path, name: item.name, played: false, id: item.id },
    ])
  }

  const deleteDownload = (videoId: string) => {
    setDownloadList(prevList => {
      const updatedList = prevList.filter(item => item.id !== videoId)
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
      return updatedList
    })

    dispatchDownloaAction({
      videoRemoteUrl: newDownloadItem.videoRemoteUrl,
      downloadDir: newDownloadItem.downloadDir,
      id: newDownloadItem.id,
    })
  }

  // 在组件挂载时读取 localStorage 数据
  useEffect(() => {
    const savedPlayList = localStorage.getItem('playList')
    const savedDirHistoryList = localStorage.getItem('dirHistoryList')

    if (savedPlayList) {
      setDownloadList(JSON.parse(savedPlayList))
    }

    if (savedDirHistoryList) {
      setDirHistoryList(JSON.parse(savedDirHistoryList))
    }
  }, [])

  // 在 dirHistoryList 更新时将其存储到 localStorage
  useEffect(() => {
    if (isFirstRender) return
    localStorage.setItem('dirHistoryList', JSON.stringify(dirHistoryList))
  }, [dirHistoryList, isFirstRender])

  // 在 downloadList 更新时将其存储到 localStorage
  useEffect(() => {
    if (isFirstRender) return
    localStorage.setItem('playList', JSON.stringify(downloadList))
  }, [downloadList, isFirstRender])

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
        return updatedList
      })
      notificationApi.success({
        message: 'Download complete',
        description: `Video saved at: ${path}`,
      })
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
        return updatedList
      })
      notificationApi.error({ message: 'Download failed', description: errorMessage })
    })
  }, [])

  return (
    <PageScroll
      styles={{ height: 'calc(100vh - 30px)' }}
      contentStyles={{}}
      footerHeight={30}
      header={
        <div className=" p-5">
          <TitleBar
            title={<Title className="section-title">Video Downloader</Title>}
            leftIcon={actionFrom === 'button' ? <ArrowLeftOutlined onClick={handleBack} /> : null}
          />
          <Row gutter={16}>
            <Col span={24}>
              <Input
                className="input-group"
                placeholder="Enter video URL"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value.trim())}
              />
            </Col>
            <Col span={24}>
              <div className=" flex  gap-4">
                <Select
                  className="input-group flex-1"
                  // style={{ width: '100%' }}
                  value={downloadDir}
                  onChange={val => setDownloadDir(val)}
                  placeholder="Select download directory"
                  options={dirHistoryList.map(item => ({ label: item, value: item }))}
                  dropdownRender={menu => (
                    <>
                      <Space style={{ padding: '0 8px 4px' }}>
                        <Button type="text" icon={<PlusOutlined />} onClick={handleSelectDirectory}>
                          Add item
                        </Button>
                      </Space>
                      <Divider style={{ margin: '8px 0' }} />
                      {menu}
                    </>
                  )}
                ></Select>
              </div>
            </Col>
            <Col span={24}>
              <Space>
                <Button
                  // className="styled-button"
                  onClick={handleDownload}
                  disabled={!downloadDir || downloadList.some(item => item.isDownloading)}
                >
                  {downloadList.some(item => item.isDownloading)
                    ? 'Downloading...'
                    : 'Start Download'}
                </Button>
                <Button onClick={handleSetAsCompleted} disabled={selections.length === 0}>
                  set completed
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      }
    >
      <List
        className="list-header"
        header={<div>Download List</div>}
        bordered
        dataSource={downloadList}
        renderItem={item => (
          <List.Item key={item.id}>
            <Row align="stretch" style={{ width: '100%', boxSizing: 'border-box' }}>
              {/* Meta 信息部分 */}
              <Col sm={24} md={12}>
                <List.Item.Meta
                  avatar={<Checkbox onChange={e => handleSelectItem(item.id, e.target.checked)} />}
                  title={
                    <Tooltip placement="top" title={item.path}>
                      {item.name}
                    </Tooltip>
                  }
                  description={`Progress: ${item.progress}`}
                />
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
                    onClick={() => addToPlayList(item)}
                    disabled={item.isDownloading || isInPlaylist(item.path)}
                    size="small"
                  >
                    Add to Playlist
                  </Button>
                  <Button
                    onClick={() => handleResetPath(item)}
                    disabled={item.isDownloading}
                    size="small"
                  >
                    Reset Path
                  </Button>
                  {item.progress !== '100%' && item.progress !== 'Error' && (
                    <Button
                      icon={item.isDownloading ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                      type="text"
                      onClick={() => handleToggleResume(item)}
                    ></Button>
                  )}

                  <Button onClick={() => deleteDownload(item.id)} size="small">
                    Delete
                  </Button>
                  {item.progress !== '100%' && !item.isDownloading && (
                    <Button onClick={() => retryDownload(item.id)}>Retry Download</Button>
                  )}
                </div>
              </Col>
            </Row>
          </List.Item>
        )}
      />
    </PageScroll>
  )
}

// export default () => <DesktopOnly children={<VideoDownloader />} />
export default VideoDownloader
