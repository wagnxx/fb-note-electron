import React, { useState, useEffect, useRef } from 'react'
import { Layout, Collapse, CollapseProps } from 'antd'
import { CaretRightOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import VideoPlayer from './components/VideoPLayer'
import VideoList from './components/Playlist'
import FileUpload, { PlayItem } from './components/FileUpload'
import FloatButton from './components/FloatButton'

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

  const collapseItems: CollapseProps['items'] = [
    {
      key: '1',
      label: 'Play List',
      children: (
        <>
          <div className={`w-full flex justify-start ${collapsed ? 'flex-col' : 'flex-row'}`}>
            <FileUpload fileInputRef={fileInputRef} setPlaylist={setPlaylist} />
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
        </>
      ),
    },
  ]

  return (
    <Layout style={{ minHeight: 'calc(100vh - 29px)' }}>
      <Sider
        width={240}
        collapsedWidth={0}
        theme="light"
        collapsible
        trigger={null}
        collapsed={collapsed}
        style={{ padding: 0 }}
      >
        <Collapse
          bordered={false}
          defaultActiveKey={['1']}
          expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
          items={collapseItems}
        />
      </Sider>

      <FloatButton
        label={<MenuUnfoldOutlined />}
        direction="vertical" // 设置为水平方向拖拽
        edgeDistance={10} // 设置距离容器边缘的最小距离
        onClick={() => setCollapsed(!collapsed)}
      />

      <Content className="box-border   " style={{ height: 'calc(100vh - 30px)' }}>
        {currentVideo && (
          <VideoPlayer video={currentVideo} setPlaylist={setPlaylist} onError={handleError} />
        )}
      </Content>
    </Layout>
  )
}

export default CinemaMoments
