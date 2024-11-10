import React, { useState, useEffect, useRef } from 'react'
import { Layout, Button } from 'antd'
import { MenuUnfoldOutlined } from '@ant-design/icons'
import VideoPlayer from './components/VideoPLayer'
import VideoList from './components/Playlist'
import FileUpload, { PlayItem } from './components/FileUpload'

const { Sider, Content } = Layout

const CinemaMoments: React.FC = () => {
  const [currentVideoURL, setCurrentVideoURL] = useState<string>('')
  const [currentVideoId, setCurrentVideoId] = useState<string>('')
  const [currentVideoName, setCurrentVideoName] = useState<string>('')
  const [playlist, setPlaylist] = useState<PlayItem[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  // 初始化播放列表
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('playlist')
    if (savedPlaylist) {
      setPlaylist(JSON.parse(savedPlaylist))
    }
  }, [])

  // 保存播放列表到本地存储
  useEffect(() => {
    localStorage.setItem('playlist', JSON.stringify(playlist))
  }, [playlist])

  const playVideo = (video: any) => {
    if (!video?.url) return
    console.log('current video url:::', video)

    let videoURL = video.url
    if (!video.url.startsWith('b')) {
      // 暂时认为都是从主进程 electron读取到的绝对路径
      videoURL = 'http://localhost:4000/video?src=' + encodeURIComponent(videoURL)
    }

    setCurrentVideoURL(videoURL)
    setCurrentVideoName(video.name)
    setCurrentVideoId(video.id)
  }

  const handleError = () => {
    if (!currentVideoURL) return
    setPlaylist(prevPlaylist =>
      prevPlaylist.map(item => (item.url === currentVideoURL ? { ...item, disabled: true } : item)),
    )
  }

  return (
    <Layout style={{ minHeight: 'calc(100vh - 60px)' }}>
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
            setPlaylist={setPlaylist}
            currentVideoId={currentVideoId}
          />
        )}
      </Sider>

      <Content className=" p-3 bg-gray-100">
        <VideoPlayer
          title={currentVideoURL}
          name={currentVideoName}
          videoSource={currentVideoURL}
          playVideo={playVideo}
          onError={handleError}
        />
      </Content>
    </Layout>
  )
}

export default CinemaMoments
