import React, { useState, useEffect, useRef } from 'react'
import { Layout, Button } from 'antd'
import { MenuUnfoldOutlined } from '@ant-design/icons'
import VideoPlayer from './components/VideoPLayer'
import VideoList from './components/Playlist'
import FileUpload, { PlayItem } from './components/FileUpload'

const { Sider, Content } = Layout

const CinemaMoments: React.FC = () => {
  // const [currentVideo, setCurrentVideo] = useState<PlayItem | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [playlist, setPlaylist] = useState<PlayItem[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const currentVideo = playlist.find(item => item.id === currentVideoId)

  // 初始化播放列表
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('playlist')
    const savedCurrentVideoId = localStorage.getItem('currentVideoId')

    if (savedPlaylist) {
      setPlaylist(JSON.parse(savedPlaylist))
    }
    if (savedCurrentVideoId) {
      setCurrentVideoId(JSON.parse(savedCurrentVideoId))
    }
  }, [])

  // 保存播放列表到本地存储
  useEffect(() => {
    localStorage.setItem('playlist', JSON.stringify(playlist))
  }, [playlist])
  useEffect(() => {
    localStorage.setItem('currentVideoId', JSON.stringify(currentVideoId))
  }, [currentVideoId])

  const playVideo = (video: PlayItem) => {
    if (!video.id) return
    setCurrentVideoId(video.id)
  }

  const removeItemVideo = (target: PlayItem) => {
    // Removed. It is playing; do not disturb it. We only deleted the item from the playlist
    if (currentVideo?.id === target.id) {
      setCurrentVideoId(null)
    }
    setPlaylist(pre => pre.filter(item => item.id !== target.id))
  }

  const handleError = () => {
    if (!currentVideo) return
    setPlaylist(prevPlaylist =>
      prevPlaylist.map(item => (item.id === currentVideo.id ? { ...item, disabled: true } : item)),
    )
  }

  return (
    <Layout style={{ minHeight: 'calc(100vh - 29px)' }}>
      <Sider
        width={200}
        collapsedWidth={40}
        theme="light"
        collapsible
        trigger={null}
        collapsed={collapsed}
        style={{ padding: '8px' }}
      >
        {/* <Button icon={<ExpandOutlined />} onClick={() => setCollapsed(!collapsed)} /> */}
        <div className={`w-full flex justify-center ${collapsed ? 'flex-col' : 'flex-row'}`}>
          <FileUpload fileInputRef={fileInputRef} setPlaylist={setPlaylist} />
          <Button icon={<MenuUnfoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
        </div>
        {!collapsed && (
          <VideoList
            playlist={playlist}
            playVideo={playVideo}
            removeItemVideo={removeItemVideo}
            setPlaylist={setPlaylist}
            currentVideo={currentVideo}
          />
        )}
      </Sider>

      <Content className="box-border bg-gray-50  " style={{ height: 'calc(100vh - 30px)' }}>
        {currentVideo && (
          <VideoPlayer video={currentVideo} setPlaylist={setPlaylist} onError={handleError} />
        )}
      </Content>
    </Layout>
  )
}

export default CinemaMoments
