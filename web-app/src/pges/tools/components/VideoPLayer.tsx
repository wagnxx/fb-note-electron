import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Slider } from 'antd'
import { PlayCircleOutlined, PauseOutlined, SoundOutlined } from '@ant-design/icons'
import './VideoPLayer.css'
import { formatSecondsToHHmmss } from '@/utils/utilsDate'
import CustomSliderWithTeeth from './CustomSliderWithTeeth'

interface VideoPlayerProps {
  videoSource: Blob | MediaSource | string | null
  title?: string
  playVideo: (videoUrl: string) => void
  onError: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSource, title, onError }) => {
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
  const getPreviewImage = (time: number) => {
    const hiddenVideo = hiddenVideoRef.current
    const canvas = canvasRef.current

    if (hiddenVideo && canvas) {
      const context = canvas.getContext('2d')
      if (context) {
        hiddenVideo.currentTime = time

        hiddenVideo.onseeked = () => {
          // 绘制当前视频的画面到canvas
          context.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height)
        }
      }
    }
  }

  // 处理滑动条的 hover 时显示预览图
  const handleSliderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (!videoRef.current) return
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left // 获取鼠标相对容器的偏移
    const sliderWidth = rect.width
    const newTime = (mouseX / sliderWidth) * duration
    setPreviewTime(newTime)
  }

  const setPreviewTime = (tm: number) => {
    setHoverTime(tm)
    getPreviewImage(tm) // 获取并显示预览图
  }

  // 点击时设置播放时间并开始播放
  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return

    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left // 获取鼠标相对容器的偏移
    const sliderWidth = rect.width
    const newTime = (mouseX / sliderWidth) * duration

    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    setHoverTime(null) // 点击时清空 hoverTime
    videoRef.current.play() // 点击时开始播放
    setIsPlaying(true)
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
    if (videoRef.current && videoSource) {
      const videoElement = videoRef.current

      if (videoSource instanceof Blob) {
        videoElement.src = URL.createObjectURL(videoSource)
      } else if (videoSource instanceof MediaSource) {
        videoElement.src = URL.createObjectURL(videoSource)
      } else if (typeof videoSource === 'string' && videoSource.startsWith('http')) {
        videoElement.src = videoSource
      }

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
  }, [videoSource])

  useEffect(() => {
    const hiddenVideo = hiddenVideoRef.current
    if (hiddenVideo && videoSource) {
      if (typeof videoSource === 'string') {
        // 如果 videoSource 是字符串类型（URL）
        hiddenVideo.src = videoSource
      } else if (videoSource instanceof Blob) {
        // 如果 videoSource 是 Blob 类型
        hiddenVideo.src = URL.createObjectURL(videoSource)
      } else {
        // 其他类型的处理（例如 MediaSource）
        console.error('Unsupported videoSource type')
      }
    }
  }, [videoSource])

  return videoSource ? (
    <div className="video-player flex-1 px-2">
      <video
        title={title}
        ref={videoRef}
        width="100%"
        height="auto"
        autoPlay={isPlaying}
        onClick={togglePlayPause}
        onError={onError}
      />
      <div className="control-panel">
        <div
          className="control-panel__slider-wrap py-1 w-full bg-red-200"
          // onMouseMove={handleSliderMouseMove} // 在父容器上监听 mousemove 事件
          // onClick={handleSliderClick} // 点击时设置当前播放时间
        >
          <CustomSliderWithTeeth max={duration} onChange={setPreviewTime} />
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
              <canvas ref={canvasRef} width={800} height={800 / aspectRatio} />
              <p style={{ color: 'white' }}>{formatSecondsToHHmmss(hoverTime)}</p>{' '}
              {/* 显示 hover 时间 */}
            </div>
          )}
        </div>

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
      </div>
      <video ref={hiddenVideoRef} style={{ display: 'none' }} />
    </div>
  ) : (
    <div className=" text-2xl flex justify-center items-center h-full  text-white w-full">
      Please select a video
    </div>
  )
}

export default VideoPlayer
