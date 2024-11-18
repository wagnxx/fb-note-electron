import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Col, notification, Popover, Row, Slider, Space, Switch, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  PauseOutlined,
  SoundOutlined,
  SettingFilled,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import './VideoPLayer.css'
import { formatSecondsToHHmmss } from '@/utils/utilsDate'
import CustomSliderWithTeeth from './CustomSliderWithTeeth'
import ScreenShots from './ScreenShots'
import { PlayItem } from './FileUpload'
import { getNameWithoutExtension } from '@/utils/utilsString'

export type ScreenshotType = {
  name: string
  at: number | null
  path: string
}
export type ScreenshotDoc = {
  docId: string
  // screenshotsMap: Record<string, string>
  screenshots: ScreenshotType[]
}
export type PlayerAtTime = {
  videoId: string
  at: number
  max: number
}
interface VideoPlayerProps {
  video: PlayItem
  setPlaylist: React.Dispatch<React.SetStateAction<PlayItem[]>>
  onError: () => void
}

export interface SliderRef {
  focus: () => void
  blur: () => void
}

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ onError, video, setPlaylist }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [skipTime, setSkipTime] = useState<number>(1)
  const [volume, setVolume] = useState<number>(100) // 新增音量控制
  const [hoverTime, setHoverTime] = useState<number | null>(null) // Hover时的时间
  const [screenshotDocs, setScreenshotDocs] = useState<ScreenshotDoc[]>([])
  const [aspectRatio, setAspectRatio] = useState<number>(5 / 3)
  const [showMoreSettings, setShowMoreSettings] = useState(true)

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const seekbarRef = useRef<SliderRef>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null) // 用于获取预览图的隐藏视频
  const canvasRef = useRef<HTMLCanvasElement | null>(null) // 用于绘制预览图的canvas

  const [notificationApi, notificationHandleContext] = notification.useNotification()

  const currentScreenShotDoc = screenshotDocs.find(item => item.docId === video.id)

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      videoRef.current?.pause()
      setIsPlaying(false)
    } else {
      videoRef.current?.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime += skipTime
    }
  }, [skipTime])

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime -= skipTime
    }
  }, [skipTime])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)

      const playerAtTime = localStorage.getItem('playerAtTime')
      let timeArray = (playerAtTime && (JSON.parse(playerAtTime) as PlayerAtTime[])) || []
      const current = timeArray.find(item => item.videoId === video.id)
      if (current) {
        current.at = videoRef.current.currentTime
        current.max = videoRef.current.duration
      } else {
        timeArray.push({
          videoId: video.id,
          at: videoRef.current.currentTime || 0,
          max: videoRef.current.duration,
        })
      }
      localStorage.setItem('playerAtTime', JSON.stringify(timeArray))
    }
  }

  const handleSliderChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value
      setCurrentTime(value)
    }
  }

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value / 100 // 0到1的音量范围
      setVolume(value)
    }
  }

  // 获取预览图的函数
  const setPreviewImage = (time: number, option?: { width: number; height: number }) => {
    const hiddenVideo = hiddenVideoRef.current
    const canvas = canvasRef.current

    return new Promise((resolve, reject) => {
      if (!hiddenVideo || !canvas) return resolve(null)

      const context = canvas.getContext('2d')
      if (context) {
        hiddenVideo.currentTime = time

        hiddenVideo.onseeked = () => {
          const drawWidth = option?.width || canvas.width
          const drawHeight = option?.height || canvas.height
          // 绘制当前视频的画面到canvas
          context.drawImage(hiddenVideo, 0, 0, drawWidth, drawHeight)

          // 将 canvas 转换为数据URL
          const dataURL = canvas.toDataURL('image/png')

          resolve(dataURL)
        }
      } else {
        resolve(null)
      }
    })
  }
  // 获取预览图的函数
  const getPreviewImage = (time: number, option: { width: number; height: number }) => {
    const hiddenVideo = hiddenVideoRef.current
    const canvas = document.createElement('canvas')

    const drawWidth = option.width
    const drawHeight = option.height

    canvas.width = drawWidth
    canvas.height = drawHeight

    return new Promise((resolve, reject) => {
      if (!hiddenVideo || !canvas) return resolve(null)

      const context = canvas.getContext('2d')
      if (context) {
        hiddenVideo.currentTime = time

        hiddenVideo.onseeked = () => {
          // 绘制当前视频的画面到canvas
          context.drawImage(hiddenVideo, 0, 0, drawWidth, drawHeight)

          // 将 canvas 转换为数据URL
          const dataURL = canvas.toDataURL('image/png')

          resolve(dataURL)
        }
      } else {
        resolve(null)
      }
    })
  }

  const saveScreenshotHandler = (tm: number) => {
    if (!videoRef.current) return
    const width = 1200
    const height = width / aspectRatio

    setHoverTime(tm)
    getPreviewImage(tm, { width, height }) // 获取并显示预览图
      .then(dataURL => {
        const options = {
          dataURL,
          enVideoPath: encodeURIComponent(video.url),
          enFolder: encodeURIComponent(getNameWithoutExtension(video.name)),
          name: formatSecondsToHHmmss(tm, '-'),
        }

        ipcRenderer
          .invoke(IPC_ACTIONS.SAVE_SCREENSHOT, options)
          .then((res: { filePath: string; message: string }) => {
            console.log('after save, response is: ', res)
            if (res.message) {
              console.log('err', res.message)
              return
            }
            if (res.filePath) {
              handleSaveScreenshot({
                docId: video.id,
                screenshots: [{ path: res.filePath, name: formatSecondsToHHmmss(tm, '-'), at: tm }],
                action: 'add',
              })
              notificationApi.success({
                message: 'Saved screenshot  successfully',
                description: `Saved filepath is : ${res.filePath}`,
              })
            }
          })
      })
    // getPreviewImage(tm) // 获取并显示预览图
  }

  const setPreviewTime = (tm: number) => {
    setHoverTime(tm)
    setPreviewImage(tm) // 获取并显示预览图
  }

  const handleCropCurrentImage = () => {
    saveScreenshotHandler(currentTime)
  }

  const handleJumpTo = (tm: number, shouldPlay: boolean = false) => {
    if (!videoRef.current) return
    videoContainerRef?.current?.scrollTo({ top: 0 })
    videoRef.current.currentTime = tm

    if (shouldPlay) {
      setIsPlaying(true)
    }
  }

  const handleSaveScreenshot = ({
    docId,
    screenshots,
    action,
  }: {
    docId: string
    screenshots: ScreenshotType[]
    action: 'add' | 'remove' | 'refresh'
  }) => {
    setScreenshotDocs(prev => {
      if (action === 'refresh') {
        return prev.map(item => {
          if (item.docId !== docId) return item
          return {
            ...item,
            screenshots: [...item.screenshots],
          }
        })
      }
      if (!prev.some(item => item.docId === docId)) {
        const newDoc: ScreenshotDoc = {
          docId,
          screenshots: screenshots,
        }
        return [...prev, newDoc]
      }

      return prev.map(doc => {
        if (docId === doc.docId) {
          const filteredScreenshots = doc.screenshots.filter(
            item => !screenshots.some(income => income.name === item.name),
          )
          if (action === 'add') {
            return {
              ...doc,
              screenshots: [...filteredScreenshots, ...screenshots],
            }
          }
          if (action === 'remove') {
            return { ...doc, screenshots: filteredScreenshots }
          }
        }
        return doc
      })
    })
  }
  // 初始化savedScreenshotDocs
  useEffect(() => {
    const savedScreenshotDocs = localStorage.getItem('screenshotDocs')

    if (savedScreenshotDocs) {
      setScreenshotDocs(JSON.parse(savedScreenshotDocs) || [])
    }
  }, [])
  useEffect(() => {
    localStorage.setItem('screenshotDocs', JSON.stringify(screenshotDocs))
  }, [screenshotDocs])

  useEffect(() => {
    const keypressHandler = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch (e.key) {
        case ' ':
          e.preventDefault() // 防止页面滚动
          togglePlayPause()
          break
        case 'ArrowLeft':
        case 'h':
        case 'H':
          skipBackward()
          break
        case 'ArrowRight':
        case 'l':
        case 'L':
          skipForward()
          break
        case 'ArrowUp':
        case 'k':
        case 'K':
          if (volume < 100) handleVolumeChange(volume + 5)
          break
        case 'ArrowDown':
        case 'j':
        case 'J':
          if (volume > 0) handleVolumeChange(volume - 5)
          break
      }
    }
    window.addEventListener('keydown', keypressHandler, false)

    return () => {
      window.removeEventListener('keydown', keypressHandler, false)
    }
  }, [skipBackward, skipForward, togglePlayPause, volume])

  useEffect(() => {
    if (videoRef.current && video) {
      const videoElement = videoRef.current

      let videoURL = video.url
      if (!video.url.startsWith('b')) {
        // 暂时认为都是从主进程 electron读取到的绝对路径
        videoURL = 'http://localhost:4000/video?src=' + encodeURIComponent(videoURL)
      }

      const playerAtTime = localStorage.getItem('playerAtTime')
      let currentAt = 0
      try {
        const timeArray = (playerAtTime && (JSON.parse(playerAtTime) as PlayerAtTime[])) || []
        const current =
          (timeArray && timeArray.find(item => item.videoId === video.id)) || ({} as PlayerAtTime)
        currentAt = current.at
      } catch (error) {}

      videoElement.src = videoURL
      videoElement.currentTime = currentAt || 0

      const handleLoadedMetadata = () => {
        setDuration(videoElement.duration)
        const videoWidth = videoElement.videoWidth
        const videoHeight = videoElement.videoHeight
        if (videoWidth && videoHeight) {
          setAspectRatio(videoWidth / videoHeight) // 计算宽高比
        }
      }

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.addEventListener('timeupdate', handleTimeUpdate)

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [video])

  useEffect(() => {
    const hiddenVideo = hiddenVideoRef.current
    if (hiddenVideo && video) {
      let videoURL = video.url
      if (!video.url.startsWith('b')) {
        // 暂时认为都是从主进程 electron读取到的绝对路径
        videoURL = 'http://localhost:4000/video?src=' + encodeURIComponent(videoURL)
      }
      hiddenVideo.src = videoURL
    }
  }, [video])

  return video ? (
    <div
      ref={videoContainerRef}
      className="video-player p-2  bg-slate-200  h-full  overflow-y-auto "
    >
      {notificationHandleContext}
      <div className="video-container relative">
        <video
          title={video.url}
          ref={videoRef}
          width="100%"
          height="auto"
          autoPlay={isPlaying}
          onClick={togglePlayPause}
          onError={onError}
        />
        <div className="control-panel" style={{ zIndex: 10 }}>
          <Slider
            ref={seekbarRef}
            value={currentTime}
            onChange={handleSliderChange}
            max={duration}
            tooltip={{
              formatter: value => formatSecondsToHHmmss(Number(value)),
            }}
          />
          <div className="btn-group flex flex-row items-center gap-2">
            <Button
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={togglePlayPause}
            />
            <div className="btn-contaier h-6">
              <Button icon={<SoundOutlined />} className="btn-item" />
              <Slider
                className="btn-slider"
                style={{ width: '100px' }}
                value={volume}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                step={1}
                tooltip={{ formatter: value => `Volume ${value}%` }}
              />
            </div>
            <span>
              {formatSecondsToHHmmss(currentTime)} / {formatSecondsToHHmmss(duration)}
            </span>

            <Popover
              content={
                <div className="popover-content">
                  {/* Show more settings section */}
                  <Row gutter={[16, 8]} align="middle">
                    <Col span={12}>
                      <span className="popover-label">More settings</span>
                    </Col>
                    <Col span={12}>
                      <Switch
                        checked={showMoreSettings}
                        onChange={setShowMoreSettings}
                        className="popover-switch"
                      />
                    </Col>
                  </Row>

                  {/* Skip time slider */}
                  <Row gutter={[16, 8]} align="middle">
                    <Col span={12}>
                      <span className="popover-label">Skip Step:</span>
                    </Col>
                    <Col span={12}>
                      <Slider
                        style={{ width: '100%' }}
                        value={skipTime}
                        onChange={value => setSkipTime(value)}
                        min={1}
                        max={60}
                        step={1}
                        tooltip={{ formatter: value => `Skip ${value}s` }}
                        className="popover-slider"
                      />
                    </Col>
                  </Row>
                </div>
              }
              title="Settings"
              overlayStyle={{ width: '250px' }}
            >
              <Button icon={<SettingFilled />} style={{ marginLeft: 'auto' }} />
            </Popover>
          </div>
        </div>
        {hoverTime !== null && (
          <div
            className="screenshot-preview"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '700px',
              // height: 'auto',
              background: 'rgba(0,0,0,0.6)',
              textAlign: 'center',
              zIndex: 1000,
            }}
          >
            <canvas ref={canvasRef} width={700} height={700 / aspectRatio} />
            <p style={{ color: 'white' }}>{formatSecondsToHHmmss(hoverTime)}</p>{' '}
            {/* 显示 hover 时间 */}
          </div>
        )}
      </div>

      {showMoreSettings && (
        <div className=" py-2 ">
          <div className=" flex items-start gap-1">
            <span className="font-bold ">Set Precision Time</span>
            <span className=" text-opacity-65 text-black">
              (You can capture screenshots at any time while the video is playing or paused.
              <Tooltip
                placement="topRight"
                title={
                  <div>
                    <p>
                      You can capture screenshots at any time while the video is playing or paused.
                      The three sliders represent hours, minutes, and seconds, from left to right.
                      Clicking on any tick mark on these sliders indicates your intention to capture
                      a screenshot at that specific moment.
                    </p>

                    <p>
                      The screenshot action is focused on the seconds slider. To take a screenshot,
                      simply double-click on a tick mark on the seconds slider, and a 'Save Image'
                      button will appear. Click this button to capture the screenshot.
                    </p>

                    <p>
                      Additionally, clicking the play button will jump the video to the selected
                      time and resume playback from that point.
                    </p>
                  </div>
                }
              >
                <QuestionCircleOutlined style={{ marginLeft: '4px' }} className=" self-start" />
              </Tooltip>
              )
            </span>
          </div>

          <div className=" py-2">
            <Space>
              <span>Current Time:</span>
              <span>
                {formatSecondsToHHmmss(currentTime)} / {formatSecondsToHHmmss(duration)}
              </span>
              <Button size="small" onClick={handleCropCurrentImage} type="text" danger>
                Take Screenshot Now
              </Button>
            </Space>
          </div>
          <CustomSliderWithTeeth
            max={duration}
            onChange={setPreviewTime}
            onSaveScreenShorts={saveScreenshotHandler}
            onJumpTo={handleJumpTo}
          />
        </div>
      )}
      <video ref={hiddenVideoRef} crossOrigin="anonymous" style={{ display: 'none' }} />
      {currentScreenShotDoc && (
        <ScreenShots
          doc={currentScreenShotDoc}
          onSaveScreenshot={handleSaveScreenshot}
          onJumpTo={handleJumpTo}
          video={video}
        />
      )}
    </div>
  ) : (
    <div className=" text-2xl flex justify-center items-center h-full  text-white w-full">
      Please select a video
    </div>
  )
}

export default VideoPlayer
