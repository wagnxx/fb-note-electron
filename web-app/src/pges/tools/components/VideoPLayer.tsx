import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Slider } from 'antd'
import { PlayCircleOutlined, PauseOutlined, SoundOutlined } from '@ant-design/icons'
import './VideoPLayer.css'
interface VideoPlayerProps {
  videoSource: Blob | MediaSource | string | null
  title?: string
  name?: string
  playVideo: (videoUrl: string) => void
  onError: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSource, title, name, onError }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [skipTime, setSkipTime] = useState<number>(1)
  const [volume, setVolume] = useState<number>(100) // 新增音量控制
  const videoRef = useRef<HTMLVideoElement | null>(null)

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

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    const mins = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')
    return `${hrs}:${mins}:${secs}`
  }

  useEffect(() => {
    if (videoRef.current && videoSource) {
      const videoElement = videoRef.current // 创建局部变量，持有 videoRef.current 的引用

      if (videoSource instanceof Blob) {
        videoElement.src = URL.createObjectURL(videoSource)
      } else if (videoSource instanceof MediaSource) {
        videoElement.src = URL.createObjectURL(videoSource)
      } else if (typeof videoSource === 'string' && videoSource.startsWith('http')) {
        videoElement.src = videoSource
      }

      const handleLoadedMetadata = () => {
        setDuration(videoElement.duration)
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
    const keypressHandler = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      if (e.key === ' ') {
        console.log('blank')
      }
      switch (e.key) {
        case ' ':
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
          volume < 100 && handleVolumeChange(volume + 1)
          break
        case 'ArrowDown':
        case 'j':
        case 'J':
          volume > 0 && handleVolumeChange(volume - 1)
          break
      }
    }
    window.addEventListener('keydown', keypressHandler, false)

    return () => {
      window.removeEventListener('keydown', keypressHandler, false)
    }
  }, [skipBackward, skipForward, togglePlayPause, volume])

  return videoSource ? (
    <div className="video-player">
      <video
        title={title}
        ref={videoRef}
        width="100%"
        height="auto"
        autoPlay={isPlaying}
        onError={onError}
      />
      <div className="control-panel">
        <Slider
          value={currentTime}
          onChange={handleSliderChange}
          max={duration}
          tooltip={{ formatter: null }} // 隐藏 tooltip
        />

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
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
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
    </div>
  ) : (
    <div className=" text-2xl flex justify-center items-center h-full">
      <div className=" bg-black text-white w-2/3 h-2/3 text-center pt-10">
        Please select a video
      </div>
    </div>
  )
}

export default VideoPlayer
