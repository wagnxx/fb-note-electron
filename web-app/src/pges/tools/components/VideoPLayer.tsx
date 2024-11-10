import React, { useEffect, useRef, useState } from 'react'
import { Button, Slider } from 'antd'
import {
  PlayCircleOutlined,
  PauseOutlined,
  ForwardOutlined,
  BackwardOutlined,
  SoundOutlined,
} from '@ant-design/icons'

interface VideoPlayerProps {
  videoSource: Blob | MediaSource | string | null
  skipTime: number
  title?: string
  name?: string
  setSkipTime: React.Dispatch<React.SetStateAction<number>>
  playVideo: (videoUrl: string) => void
  onError: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSource,
  skipTime,
  title,
  name,
  setSkipTime,
  onError,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pause()
      setIsPlaying(false)
    } else {
      videoRef.current?.play()
      setIsPlaying(true)
    }
  }

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += skipTime
    }
  }

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= skipTime
    }
  }

  useEffect(() => {
    if (videoRef.current && videoSource) {
      if (videoSource instanceof Blob) {
        // 如果是 Blob 类型，直接将其作为 video src
        videoRef.current.src = URL.createObjectURL(videoSource)
      } else if (videoSource instanceof MediaSource) {
        // 如果是 MediaSource 类型，创建一个 Object URL 并绑定到 video 元素
        videoRef.current.src = URL.createObjectURL(videoSource)
      } else if (videoSource?.startsWith('http')) {
        videoRef.current.src = videoSource
      }
    }

    return () => {
      // 清理 Blob URL
      if (videoRef.current && videoSource instanceof Blob) {
        URL.revokeObjectURL(videoRef.current.src)
      }
    }
  }, [videoSource])

  useEffect(() => {
    const keypressHandler = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      console.log('video::', videoRef.current)
      switch (e.key) {
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
          console.log('audio voice up')
          break
        case 'ArrowDown':
        case 'j':
        case 'J':
          console.log('audio voice down')
          break
      }
    }
    window.addEventListener('keydown', keypressHandler, false)

    return () => {
      window.removeEventListener('keypress', keypressHandler, false)
    }
  }, [])

  return videoSource ? (
    <div className="video-player">
      <div className=" font-bold text-lg pt-0 pb-2">{name}】</div>
      <video
        title={title}
        ref={videoRef}
        width="100%"
        height="auto"
        autoPlay={isPlaying}
        onError={onError}
      />
      <div className="control-panel">
        <Button
          icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
          onClick={togglePlayPause}
        />
        <Button icon={<ForwardOutlined />} onClick={skipForward} />
        <Button icon={<BackwardOutlined />} onClick={skipBackward} />
        <Slider value={skipTime} onChange={value => setSkipTime(value)} min={1} max={10} step={1} />
        <Button icon={<SoundOutlined />} />
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
