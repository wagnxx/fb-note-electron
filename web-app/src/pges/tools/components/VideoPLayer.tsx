import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, notification, Slider } from 'antd'
import { PlayCircleOutlined, PauseOutlined, SoundOutlined } from '@ant-design/icons'
import './VideoPLayer.css'
import { formatSecondsToHHmmss } from '@/utils/utilsDate'
import CustomSliderWithTeeth from './CustomSliderWithTeeth'
import ScreenShots from './ScreenShots'
import { PlayItem } from './FileUpload'
import { getNameWithoutExtension } from '@/utils/utilsString'

interface VideoPlayerProps {
  video: PlayItem
  playVideo: (videoUrl: string) => void
  onSaveScreenshot: ({
    videoId,
    screenshops,
    action,
  }: {
    videoId: string
    screenshops: Array<{ path: string; name: string }>
    action: 'add' | 'remove'
  }) => void
  onError: () => void
}
const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ onError, video, onSaveScreenshot }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [skipTime, setSkipTime] = useState<number>(1)
  const [volume, setVolume] = useState<number>(100) // 新增音量控制
  const [hoverTime, setHoverTime] = useState<number | null>(null) // Hover时的时间
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null) // 用于获取预览图的隐藏视频
  const canvasRef = useRef<HTMLCanvasElement | null>(null) // 用于绘制预览图的canvas

  const [aspectRatio, setAspectRatio] = useState<number>(5 / 3)

  const [notificationApi, notificationHandleContext] = notification.useNotification()

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
              onSaveScreenshot({
                videoId: video.id,
                screenshops: [{ path: res.filePath, name: formatSecondsToHHmmss(tm, '-') }],
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

      videoElement.src = videoURL

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
    <div className="video-player flex-1  p-2  bg-slate-200">
      {notificationHandleContext}
      <video
        title={video.url}
        ref={videoRef}
        width="100%"
        height="auto"
        autoPlay={isPlaying}
        onClick={togglePlayPause}
        onError={onError}
      />
      <div className="control-panel">
        <div className="btn-group flex flex-row items-center gap-2">
          <Button
            icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={togglePlayPause}
          />
          <Button icon={<SoundOutlined />} />
          <Slider
            style={{ width: '100px' }}
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            step={1}
            tooltip={{ formatter: value => `Volume ${value}%` }}
          />
          <span>
            {formatSecondsToHHmmss(currentTime)} / {formatSecondsToHHmmss(duration)}
          </span>
          <span>SkipTime:</span>
          <Slider
            style={{ width: '100px' }}
            value={skipTime}
            onChange={value => setSkipTime(value)}
            min={1}
            max={60}
            step={1}
            tooltip={{ formatter: value => `Skip ${value}s` }}
          />
        </div>
        <div
          className="control-panel__slider-wrap py-1 w-full "
          // onMouseMove={handleSliderMouseMove} // 在父容器上监听 mousemove 事件
          // onClick={handleSliderClick} // 点击时设置当前播放时间
        >
          <Slider
            value={currentTime}
            onChange={handleSliderChange}
            max={duration}
            included={false}
            tooltip={{ formatter: null }} // 隐藏 tooltip
          />
          {hoverTime !== null && (
            <div
              className="screenshot-preview"
              style={{
                position: 'absolute',
                bottom: 'calc(100% - 10px)',
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

          <CustomSliderWithTeeth
            max={duration}
            onChange={setPreviewTime}
            onSaveScreenShorts={saveScreenshotHandler}
          />
        </div>
      </div>
      <video ref={hiddenVideoRef} crossOrigin="anonymous" style={{ display: 'none' }} />
      {video.screenshots && (
        <ScreenShots
          data={video.screenshots}
          onSaveScreenshot={onSaveScreenshot}
          videoId={video.id}
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
