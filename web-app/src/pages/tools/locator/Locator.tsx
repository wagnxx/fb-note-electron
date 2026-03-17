// src/pages/tools/locator/App.tsx
import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L, { LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Layout, Button, Modal, List, Typography, Space, Badge, Input } from 'antd'
import { CheckOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'

import { useNotification } from '@/hooks/useNotification'
import { distanceKm } from './utils'
import { GeocodeSearch } from './components/GeocodeSearch'
import { LineSegment, LocationPoint, MeasurePoint, Task, TaskType } from '@/features/locator/types'
import { defaultMapIcon } from '@/features/locator/constants'
import { FitBounds } from './components/FitBounds'

import { TaskMarkers } from './components/TaskMarkers'
import { LocationMarkers } from './components/LocationMarkers'
import { RealtimeMarker } from './components/RealtimeMarker'
import { MapToolbar } from './components/MapToolbar'
import { MapClickHandler } from './components/MapClickHandler' // 保留原来的点击逻辑
import { EyeIcon } from 'lucide-react'

const { Sider, Content } = Layout
const { Title, Text } = Typography

L.Marker.prototype.options.icon = defaultMapIcon

export default function App() {
  const { notification } = useNotification()

  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([35.8617, 104.1954])
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [measureMode, setMeasureMode] = useState(false)
  const [startMeasurePoint, setStartMeasurePoint] = useState<MeasurePoint | null>(null)
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([])
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  // 在组件顶层（和其他 useState 并列）
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  const nextPointId = useRef(1)
  const nextTaskId = useRef(1)

  const addToTaskLatLng = useRef<{ lat: number; lng: number } | null>(null)
  const pendingLocationToAdd = useRef<LocationPoint | null>(null)
  const mapRef = useRef<L.Map>(null)

  const selectedTask = tasks.find(t => t.id === currentTaskId) || null
  const allPoints = selectedTask?.points || []

  /* --------------------------- */
  /* --- Realtime Location Watch */
  /* --------------------------- */
  useEffect(() => {
    if (!navigator.geolocation) {
      notification.warning({ message: '定位不可用', description: '浏览器不支持定位' })
      return
    }
    const id = navigator.geolocation.watchPosition(
      pos => setCurrentPosition([pos.coords.latitude, pos.coords.longitude]),
      err => console.warn('定位失败', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  /* --------------------------- */
  /* --- Task & Point Operations */
  /* --------------------------- */
  function addCircleTask() {
    const name = window.prompt('请输入任务名称')
    if (!name) return
    const t: Task = { id: String(nextTaskId.current++), name, points: [], completed: false, type: TaskType.Circle }
    setTasks(prev => [...prev, t])
    setCurrentTaskId(t.id)
  }
  function toggleTaskExpanded(taskId: string) {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  function removeTask(taskId: string) {
    Modal.confirm({
      title: '删除任务',
      content: '确认删除该任务？此操作不可撤销。',
      onOk() {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        if (currentTaskId === taskId) setCurrentTaskId(null)
      },
    })
  }

  function completeTask(taskId: string) {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, completed: true } : t)))
    setCurrentTaskId(null)
    notification.success({ message: '任务完成', description: '该任务已标记为完成' })
  }

  function addPointToTask(taskId: string, lat: number, lng: number, distanceKm = 5) {
    const p: MeasurePoint = { id: String(nextPointId.current++), lat, lng, distanceKm }
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, points: [...t.points, p] } : t)))
    setSelectedPointId(p.id)
    notification.success({ message: '已添加点', description: `已加入任务 ${taskId}` })
  }

  function addLineSegment(start: MeasurePoint, end: MeasurePoint) {
    const dist = distanceKm(start, end)
    const id = `${start.id}-${end.id}-${Date.now()}`
    setLineSegments(prev => [...prev, { id, start, end, distanceKm: dist }])
    Modal.info({
      title: '测量结果',
      content: `线段距离: ${dist.toFixed(2)} km\n起点: (${start.lat.toFixed(5)}, ${start.lng.toFixed(5)})\n终点: (${end.lat.toFixed(5)}, ${end.lng.toFixed(5)})`,
    })
  }

  function openAddToTaskModal(lat: number, lng: number) {
    addToTaskLatLng.current = { lat, lng }
    setAddToTaskModalVisible(true)
  }

  const [addToTaskModalVisible, setAddToTaskModalVisible] = useState(false)

  function handleAddToTaskSelected(taskId: string) {
    const loc = pendingLocationToAdd.current
    if (loc) {
      addPointToTask(taskId, loc.lat, loc.lng)
      pendingLocationToAdd.current = null
    } else if (addToTaskLatLng.current) {
      addPointToTask(taskId, addToTaskLatLng.current.lat, addToTaskLatLng.current.lng)
      addToTaskLatLng.current = null
    }
    setAddToTaskModalVisible(false)
  }

  const handleFly = (latlng: L.LatLngExpression) => {
    if (mapRef.current) {
      mapRef.current.flyTo(latlng, 16, {
        duration: 1,
        animate: true,
      })
    } else {
      notification.warning({ message: '地图未初始化' })
    }
  }

  /* --------------------------- */
  /* --- Map Fit Bounds for Locations */
  /* --------------------------- */
  useEffect(() => {
    if (!locations.length) return
    const latlngs = locations.map(l => [l.lat, l.lng] as [number, number])
    try {
      if (mapRef.current && latlngs.length) {
        const bounds = L.latLngBounds(latlngs)
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
      }
    } catch (err) {
      //
    }
  }, [locations])

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={340}
        collapsedWidth={0}
        style={{
          background: '#fff',
          borderRight: '1px solid #eee',
          padding: collapsed ? 0 : 16,
          position: 'relative', // ⭐ 必须加
          transition: 'all 0.3s',
        }}
      >
        {/* ⭐ 固定在侧边栏外侧的小圆按钮（Leaflet风格） */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: collapsed ? -48 : -1, // ⭐ 展开时贴边，折叠时显示在外面
            zIndex: 999,
            transition: 'right 0.3s',
          }}
        >
          <Button
            onClick={() => setCollapsed(!collapsed)}
            icon={
              collapsed ? (
                <MenuUnfoldOutlined style={{ color: '#333', fontSize: 16 }} />
              ) : (
                <MenuFoldOutlined style={{ color: '#333', fontSize: 16 }} />
              )
            }
          />
        </div>

        {/* ⭐ 以下内容完全是你的原样，没有动任何一行 */}
        {!collapsed && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingRight: 30 }}>
              <Title level={5} style={{ margin: 0 }}>
                任务面板
              </Title>
              <MapToolbar
                measureMode={measureMode}
                setMeasureMode={setMeasureMode}
                currentPosition={currentPosition}
                mapRef={mapRef}
                notification={notification}
                addTask={addCircleTask}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <GeocodeSearch onResult={(lat, lng) => handleFly([lat, lng])} onSetLocations={setLocations} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <Space style={{ marginBottom: 6 }}>
                <Text strong>当前任务：</Text>
                <Text>{selectedTask ? selectedTask.name : <Text type="secondary">未选择</Text>}</Text>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  onClick={() => selectedTask && completeTask(selectedTask.id)}
                  icon={<CheckOutlined />}
                  disabled={!selectedTask || selectedTask.completed}
                >
                  标记完成
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => selectedTask && removeTask(selectedTask.id)}
                  style={{ marginLeft: 8 }}
                >
                  删除任务
                </Button>
              </div>
            </div>

            <List
              dataSource={tasks}
              renderItem={t => {
                const isExpanded = !!expandedTasks[t.id]

                return (
                  <List.Item
                    key={t.id}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      borderRadius: 12,
                      border: '1px solid #eaeaea',
                      background: t.id === currentTaskId ? '#eef9ff' : '#fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      opacity: t.completed ? 0.65 : 1,
                      transition: 'all 0.2s',
                      display: 'block',
                    }}
                  >
                    {/* 顶部信息行：标题 + 操作按钮 */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 15 }}>
                          {t.name}
                        </Text>
                        {t.completed && <Badge status="success" text="完成" />}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button size="small" shape="circle" onClick={() => setCurrentTaskId(t.id)} title="查看任务">
                          <EyeIcon />
                        </Button>

                        <Button
                          size="small"
                          shape="circle"
                          onClick={() => toggleTaskExpanded(t.id)}
                          title={isExpanded ? '收起点列表' : '展开点列表'}
                        >
                          {isExpanded ? '−' : '+'}
                        </Button>
                      </div>
                    </div>

                    {/* 次行：点数及简要信息 */}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      点数：{t.points.length}
                    </Text>

                    {/* 折叠的点列表区域 */}
                    <div
                      style={{
                        marginTop: 12,
                        overflow: 'hidden',
                        transition: 'max-height 0.25s ease',
                        maxHeight: isExpanded ? 400 : 0, // 展开高度上限，可根据需要调整
                      }}
                    >
                      {/* 内部卡片容器 */}
                      <div
                        style={{
                          padding: isExpanded ? 12 : 0,
                          background: '#fafafa',
                          borderRadius: 10,
                          border: '1px solid #f0f0f0',
                          marginTop: isExpanded ? 8 : 0,
                        }}
                      >
                        <List
                          size="small"
                          dataSource={t.points}
                          renderItem={(p, idx) => (
                            <List.Item
                              key={p.id ?? idx}
                              style={{
                                border: 'none',
                                padding: '8px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <div style={{ minWidth: 56 }}>
                                <Text strong style={{ fontSize: 13 }}>
                                  点 {idx}
                                </Text>
                                <div style={{ fontSize: 11, color: '#888' }}>
                                  ({p.lat?.toFixed?.(4) ?? ''}, {p.lng?.toFixed?.(4) ?? ''})
                                </div>
                              </div>

                              <div style={{ flex: 1 }}>
                                {/* 保持原来你用 value 的行为：若需编辑行为可以再扩展 */}
                                <Input size="small" value={String(p.distanceKm)} readOnly style={{ width: '100%' }} />
                              </div>

                              <div style={{ marginLeft: 8, display: 'flex', gap: 6 }}>
                                {/* 可扩展的点操作按钮（示例：选中该点） */}
                                <Button size="small" onClick={() => setSelectedPointId(p.id)} title="选中该点">
                                  选中
                                </Button>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                    </div>
                  </List.Item>
                )
              }}
            />
          </>
        )}
      </Sider>

      <Layout>
        <Content style={{ height: '100%' }}>
          <MapContainer
            center={mapCenter}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            ref={mapRef}
          >
            <ZoomControl position="topright" />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* 父组件传入所有必需 props */}
            <MapClickHandler
              currentTaskId={currentTaskId}
              tasks={tasks}
              addPointToTask={addPointToTask}
              startMeasurePoint={startMeasurePoint}
              setStartMeasurePoint={setStartMeasurePoint}
              addLineSegment={addLineSegment}
              allowAddWhenNoTask={tasks.length > 0}
              openAddToTaskModal={(lat, lng) => console.log('打开选择任务弹窗', lat, lng)}
            />

            <RealtimeMarker
              position={currentPosition}
              tasks={tasks}
              currentTaskId={currentTaskId}
              addPointToTask={addPointToTask}
              notification={notification}
            />

            <TaskMarkers
              points={allPoints}
              selectedPointId={selectedPointId}
              lineSegments={lineSegments}
              setStartMeasurePoint={setStartMeasurePoint}
              setSelectedPointId={setSelectedPointId}
              notification={notification}
            />

            <MarkerClusterGroup>
              <LocationMarkers
                locations={locations}
                onAddToTask={loc => {
                  pendingLocationToAdd.current = loc
                  setAddToTaskModalVisible(true)
                }}
                mapRef={mapRef}
              />
            </MarkerClusterGroup>

            <FitBounds points={allPoints} />
          </MapContainer>
        </Content>
      </Layout>

      <Modal
        title="选择要添加到的任务"
        open={addToTaskModalVisible}
        onCancel={() => setAddToTaskModalVisible(false)}
        footer={null}
      >
        {tasks.length === 0 ? (
          <div>
            <Text>当前没有任务，请先创建任务。</Text>
            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                onClick={() => {
                  setAddToTaskModalVisible(false)
                  addCircleTask()
                }}
              >
                新增任务
              </Button>
            </div>
          </div>
        ) : (
          <List
            dataSource={tasks}
            renderItem={t => (
              <List.Item onClick={() => handleAddToTaskSelected(t.id)} style={{ cursor: 'pointer' }}>
                {t.name}
              </List.Item>
            )}
          />
        )}
      </Modal>
    </Layout>
  )
}
