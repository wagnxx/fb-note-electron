import React, { useId } from 'react'
import { List, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import './Playlist.css'
import { PlayItem } from './FileUpload'

interface VideoListProps {
  currentVideoId: string
  playlist: any[]
  playVideo: (video: any) => void
  setPlaylist: React.Dispatch<React.SetStateAction<PlayItem[]>>
  removeItemVideo: (target: PlayItem) => void
}

const VideoList: React.FC<VideoListProps> = ({
  playlist,
  playVideo,
  setPlaylist,
  currentVideoId,
  removeItemVideo,
}) => {
  console.log('currentVideoId::', useId())
  const removeItem = (target: PlayItem) => {
    setPlaylist(pre => pre.filter(item => item.id !== target.id))
  }
  return (
    <List
      itemLayout="horizontal"
      dataSource={playlist}
      renderItem={item => (
        <List.Item
          style={{
            width: '100%',
            overflowX: 'auto',
            background: currentVideoId === item.id ? 'aquamarine' : 'inherit',
          }}
          className={`${item.disabled ? 'disabled' : ''}`}
          actions={[
            <Button
              icon={<DeleteOutlined />}
              disabled={false}
              onClick={() => removeItemVideo(item)}
            ></Button>,
          ]}
          onClick={() => {
            !item.disabled && playVideo(item)
          }}
        >
          <List.Item.Meta title={item.name} />
        </List.Item>
      )}
    />
  )
}

export default VideoList
