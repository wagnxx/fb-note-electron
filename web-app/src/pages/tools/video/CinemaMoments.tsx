import React, { useState, useEffect, useRef } from 'react'
import { Layout, Collapse, CollapseProps, Button } from 'antd'
import { CaretRightOutlined, CloudDownloadOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import VideoPlayer from './components/VideoPLayer'
import VideoList from './components/Playlist'
import FileUpload, { PlayItem } from './components/FileUpload'
import FloatButton from './components/FloatButton'
import useFirstRender from '@/hooks/useFirstRender'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  setCurrentVideoId as updateCurrentVideoId,
  setPlaylist as updatePlayList,
} from '@/features/video/videoPlayer'
import { selectCurrentVideo } from '@/features/video/selectors'
import { useNavigate } from 'react-router-dom'

const { Sider, Content } = Layout

const CinemaMoments: React.FC = () => {
  const { playlist, currentVideoId } = useSelector((state: RootState) => state.videoPlayer)
  const currentVideo = useSelector(selectCurrentVideo)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const isFirstRender = useFirstRender()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const setPlaylist = (action: PlayItem[] | ((data: PlayItem[]) => PlayItem[])) =>
    dispatch(updatePlayList(action))
  const setCurrentVideoId = (id: string | null) => dispatch(updateCurrentVideoId(id))

  // 保存播放列表到本地存储
  useEffect(() => {
    if (isFirstRender) return
    localStorage.setItem('playlist', JSON.stringify(playlist))
  }, [isFirstRender, playlist])
  useEffect(() => {
    if (isFirstRender) return
    localStorage.setItem('currentVideoId', JSON.stringify(currentVideoId))
  }, [currentVideoId, isFirstRender])

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
          <div className={`w-full flex justify-start gap-2 ${collapsed ? 'flex-col' : 'flex-row'}`}>
            <FileUpload fileInputRef={fileInputRef} setPlaylist={setPlaylist} />
            <Button
              icon={<CloudDownloadOutlined />}
              onClick={() => navigate('/tool/video/videoDownloader?from=button')}
            />
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
