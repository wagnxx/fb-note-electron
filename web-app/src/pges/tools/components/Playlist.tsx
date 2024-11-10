import React, { useId } from 'react'
import { List, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import './Playlist.css'

interface VideoListProps {
  currentVideoId: string
  playlist: any[]
  playVideo: (video: any) => void
  setPlaylist: React.Dispatch<React.SetStateAction<any[]>>
  // removeItemVideo: (url: string) => void
}

const VideoList: React.FC<VideoListProps> = ({
  playlist,
  playVideo,
  setPlaylist,
  currentVideoId,
}) => {
  console.log('currentVideoId::', useId())
  const removeItem = (url: string) => {
    setPlaylist(pre => pre.filter(item => item.url !== url))
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
              onClick={() => removeItem(item.url)}
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
