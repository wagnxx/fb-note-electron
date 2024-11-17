import React, { useEffect, useState } from 'react'
import { Button, List } from 'antd'
import './Playlist.css'
import { PlayItem } from './FileUpload'
import { DeleteOutlined } from '@ant-design/icons'
import { PlayerAtTime } from './VideoPLayer'

interface VideoListProps {
  currentVideo?: PlayItem | null
  playlist: PlayItem[]
  playVideo: (video: PlayItem) => void
  setPlaylist: React.Dispatch<React.SetStateAction<PlayItem[]>>
  removeItemVideo: (target: PlayItem) => void
}

const VideoList: React.FC<VideoListProps> = ({
  currentVideo,
  playlist,
  playVideo,
  setPlaylist,
  removeItemVideo,
}) => {
  const [playerAtTimeRate, setPlayerAtTimeRate] = useState<{ videoId: string; rate: number }[]>([])

  // 从 localStorage 获取视频播放进度并计算比例
  useEffect(() => {
    const playerAtTime = localStorage.getItem('playerAtTime')
    try {
      const timeArray = (playerAtTime && (JSON.parse(playerAtTime) as PlayerAtTime[])) || []
      const rates = timeArray.map(item => ({
        videoId: item.videoId,
        rate: item.at / item.max,
      }))
      setPlayerAtTimeRate(rates) // 更新进度状态
    } catch (error) {
      console.error('Error parsing playerAtTime from localStorage:', error)
    }
  }, []) // 依赖为空数组，确保只在组件挂载时执行一次

  // 获取当前视频的播放进度
  const getCurrentRate = (id: string) => {
    return playerAtTimeRate.find(item => item.videoId === id)?.rate || 0
  }

  const handleDelete = (item: PlayItem) => {
    removeItemVideo(item)
  }

  // if (playerAtTimeRate.length === 0) {
  //   // 如果没有加载进度数据，先显示加载状态
  //   return <div>Loading...</div>
  // }

  return (
    <List
      itemLayout="horizontal"
      dataSource={playlist}
      renderItem={(item: PlayItem) => {
        const currentRate = getCurrentRate(item.id) // 获取每个视频的播放进度
        return (
          <div
            style={{
              marginTop: '8px',
              border: '1px solid #ddd',
              background: currentVideo?.id === item.id ? 'aquamarine' : 'inherit',
            }}
          >
            <List.Item
              style={{
                width: '100%',
                overflowX: 'auto',
              }}
              className={item.disabled ? 'disabled' : ''}
              actions={[
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={false}
                  onClick={() => handleDelete(item)}
                />,
              ]}
              onClick={() => {
                !item.disabled && playVideo(item)
              }}
              onDoubleClick={() => handleDelete(item)}
            >
              <List.Item.Meta title={item.name} />
            </List.Item>
            <div
              style={{
                width: `calc(100% * ${currentRate})`, // 使用计算出的 rate 更新进度条宽度
                height: '4px',
                background: 'red',
              }}
            />
          </div>
        )
      }}
    />
  )
}

export default VideoList
