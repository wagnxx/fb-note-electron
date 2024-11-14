import React from 'react'
import { List, Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import './Playlist.css'
import { PlayItem } from './FileUpload'

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
  console.log('playlist::', playlist)
  // const removeItem = (target: PlayItem) => {
  //   setPlaylist(pre => pre.filter(item => item.id !== target.id))
  // }
  return (
    <List
      itemLayout="horizontal"
      dataSource={playlist}
      renderItem={(item: PlayItem) => (
        <List.Item
          style={{
            width: '100%',
            overflowX: 'auto',
            background: currentVideo?.id === item.id ? 'aquamarine' : 'inherit',
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
