import React, { useState, useEffect, useRef } from 'react'
import { Layout, Button } from 'antd'
import { MenuUnfoldOutlined } from '@ant-design/icons'
import VideoPlayer from './components/VideoPLayer'
import VideoList from './components/Playlist'
import FileUpload, { PlayItem } from './components/FileUpload'

const { Sider, Content } = Layout

const CinemaMoments: React.FC = () => {
  const [currentVideo, setCurrentVideo] = useState<PlayItem | null>(null)
  const [playlist, setPlaylist] = useState<PlayItem[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  // 初始化播放列表
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('playlist')
    const savedCurrentVideo = localStorage.getItem('currentVideo')

    if (savedPlaylist) {
      setPlaylist(JSON.parse(savedPlaylist))
    }
    if (savedCurrentVideo) {
      setCurrentVideo(JSON.parse(savedCurrentVideo))
    }
  }, [])

  // 保存播放列表到本地存储
  useEffect(() => {
    localStorage.setItem('playlist', JSON.stringify(playlist))
  }, [playlist])
  useEffect(() => {
    localStorage.setItem('currentVideo', JSON.stringify(currentVideo))
  }, [currentVideo])

  const playVideo = (video: any) => {
    if (!video?.url) return
    setCurrentVideo({
      ...video,
    })
  }

  const removeItemVideo = (target: PlayItem) => {
    // Removed. It is playing; do not disturb it. We only deleted the item from the playlist
    if (currentVideo?.id === target.id) {
      setCurrentVideo(null)
    }
    setPlaylist(pre => pre.filter(item => item.id !== target.id))
  }

  const handleError = () => {
    if (!currentVideo) return
    setPlaylist(prevPlaylist =>
      prevPlaylist.map(item => (item.id === currentVideo.id ? { ...item, disabled: true } : item)),
    )
  }
  const handleSaveScreenshot = ({
    videoId,
    action = 'add',
    screenshops,
  }: {
    videoId: string
    screenshops: Array<{ path: string; name: string }>
    action: 'add' | 'remove'
  }) => {
    setPlaylist(prevPlaylist => {
      const updatedPlaylist = prevPlaylist.map(item => {
        if (item.id !== videoId) return item

        const initScreenshots = item.screenshots || {}
        const restScreenshot = Object.fromEntries(
          Object.entries(initScreenshots).filter(([key, value]) => {
            return !screenshops.some(sc => sc.name === key)
          }),
        )

        const newScreeshots = screenshops.reduce(
          (pre, cur) => {
            pre[cur.name] = cur.path
            return pre
          },
          {} as Record<string, string>,
        )

        const updateScreenshots =
          action === 'add' ? { ...restScreenshot, ...newScreeshots } : restScreenshot
        const updateItem = { ...item, screenshots: updateScreenshots }
        return updateItem
      })

      // 强制断言 currentVideo 为 PlayItem
      if (currentVideo?.id === videoId) {
        setCurrentVideo(prevVideo => {
          const initScreenshots = prevVideo?.screenshots || {}
          const restScreenshot = Object.fromEntries(
            Object.entries(initScreenshots).filter(([key, value]) => {
              return !screenshops.some(sc => sc.name === key)
            }),
          )

          const newScreeshots = screenshops.reduce(
            (pre, cur) => {
              pre[cur.name] = cur.path
              return pre
            },
            {} as Record<string, string>,
          )
          const updateScreenshots =
            action === 'add' ? { ...restScreenshot, ...newScreeshots } : restScreenshot

          return {
            ...(prevVideo as PlayItem), // 强制类型断言
            screenshots: updateScreenshots,
          }
        })
      }

      return updatedPlaylist
    })
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

      <Content
        className="box-border bg-gray-50    overflow-y-auto"
        style={{ height: 'calc(100vh - 30px)' }}
      >
        {currentVideo && (
          <VideoPlayer
            video={currentVideo}
            playVideo={playVideo}
            onError={handleError}
            onSaveScreenshot={handleSaveScreenshot}
          />
        )}
      </Content>
    </Layout>
  )
}

export default CinemaMoments
