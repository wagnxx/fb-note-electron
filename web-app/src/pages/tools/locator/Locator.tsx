// App.tsx (完整文件)
import React, { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMapEvents,
  useMap,
  ZoomControl,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'

import L, { LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { Layout, Button, Input, InputNumber, Modal, List, Typography, Space, Tooltip, Badge } from 'antd'
import {
  PlusOutlined,
  AimOutlined,
  SearchOutlined,
  SwapOutlined,
  CheckOutlined,
  ShrinkOutlined,
} from '@ant-design/icons'
// import 'antd/dist/antd.css' // assume globally imported in your app

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import { useNotification } from '@/hooks/useNotification' // 按你项目保持不变

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { Search } = Input

/* ---------------------------
   Fix default Leaflet icon (avoid missing 2x issue)
   --------------------------- */
const defaultIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = defaultIcon

/* ---------------------------
   Custom red div icon for search results
   (so it visually differs from default blue marker)
   --------------------------- */
// 红色 marker 替代蓝色默认
const searchMarkerIcon = L.divIcon({
  className: 'search-marker-icon',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #e55353;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg) translate(-50%, -50%);
      position: relative;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24], // 尖端对准地理坐标
})

const locatedIcon = L.divIcon({
  className: 'search-result-icon',
  html: `<div style="
    width: 16px;
    height: 16px;
    border: 2px solid #fff;
    background-color: #0f89f5;
    border-radius: 50%;
    box-shadow: 2px 2px 2px rgba(0, 0, 0, .15);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/* ---------------------------
   Types
   --------------------------- */
type MeasurePoint = {
  id: string
  lat: number
  lng: number
  distanceKm: number
}

type Task = {
  id: string
  name: string
  points: MeasurePoint[]
  completed: boolean
}

type LineSegment = {
  id: string
  start: MeasurePoint
  end: MeasurePoint
  distanceKm: number
}

interface LocationPoint {
  id: string | number
  lat: number
  lng: number
  title?: string
}

/* ---------------------------
   Utilities
   --------------------------- */
function distanceKm(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/* ---------------------------
   Map Click Handler
   - keep as before (adding points / measure mode / open add-to-task modal)
   --------------------------- */
function MapClickHandler({
  currentTaskId,
  tasks,
  addPointToTask,
  measureMode,
  startMeasurePoint,
  setStartMeasurePoint,
  addLineSegment,
  allowAddWhenNoTask,
  openAddToTaskModal,
}: {
  currentTaskId: string | null
  tasks: Task[]
  addPointToTask: (taskId: string, lat: number, lng: number) => void
  measureMode: boolean
  startMeasurePoint: MeasurePoint | null
  setStartMeasurePoint: (p: MeasurePoint | null) => void
  addLineSegment: (start: MeasurePoint, end: MeasurePoint) => void
  allowAddWhenNoTask: boolean
  openAddToTaskModal: (lat: number, lng: number) => void
}) {
  const { notification } = useNotification()
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng

      // measure mode
      if (measureMode) {
        if (!startMeasurePoint) {
          setStartMeasurePoint({ id: 'tmp', lat, lng, distanceKm: 0 })
          notification.info({ message: '测量', description: '已选择起点，请选择终点' })
        } else {
          addLineSegment(startMeasurePoint, { id: 'tmp2', lat, lng, distanceKm: 0 })
          setStartMeasurePoint(null)
        }
        return
      }

      // no task selected
      if (!currentTaskId) {
        if (allowAddWhenNoTask && tasks.length > 0) {
          openAddToTaskModal(lat, lng)
          return
        }
        notification.warning({ message: '未选择任务', description: '请先选择任务或新增任务后再添加点' })
        return
      }

      const task = tasks.find(t => t.id === currentTaskId)
      if (task && task.completed) {
        notification.warning({ message: '任务已完成', description: '该任务已完成，不能添加点' })
        return
      }

      Modal.confirm({
        title: '添加点',
        content: '请选择操作：添加测量点（圆）或仅添加标记？',
        icon: null,
        // we hide default ok/cancel and provide custom footer to include a '取消' action
        okButtonProps: { style: { display: 'none' } },
        cancelButtonProps: { style: { display: 'none' } },
        footer: (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                addPointToTask(currentTaskId, lat, lng) // 添加带圈的点
                Modal.destroyAll()
              }}
            >
              添加测量点（画圈）
            </Button>
            <Button
              onClick={() => {
                addPointToTask(currentTaskId, lat, lng) // 仅标记
                Modal.destroyAll()
              }}
            >
              仅添加标记
            </Button>
            <Button
              danger
              onClick={() => {
                Modal.destroyAll() // 取消 — 什么都不做
              }}
            >
              取消
            </Button>
          </Space>
        ),
      })
    },
  })
  return null
}

/* ---------------------------
   FitBounds (compute bounds from circle extents)
   --------------------------- */
function FitBounds({ points }: { points: MeasurePoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity
    points.forEach(p => {
      const latDelta = p.distanceKm / 111
      const lngDelta = p.distanceKm / (111 * Math.cos((p.lat * Math.PI) / 180))
      minLat = Math.min(minLat, p.lat - latDelta)
      maxLat = Math.max(maxLat, p.lat + latDelta)
      minLng = Math.min(minLng, p.lng - lngDelta)
      maxLng = Math.max(maxLng, p.lng + lngDelta)
    })
    const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng])
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
  }, [map, points])
  return null
}

/* ---------------------------
   Search component (Nominatim) — returns multiple results
   - onSetLocations 会把所有候选点放到地图上（红色）
   - 不再使用强制弹窗列列表（保留轻量 info modal 作为备选）
   --------------------------- */
function GeocodeSearch({
  onResult,
  onSetLocations,
}: {
  onResult: (lat: number, lng: number, display_name?: string) => void
  onSetLocations: (arr: LocationPoint[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const { notification } = useNotification()

  const doSearch = async (q: string) => {
    if (!q) return
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data && data.length) {
        const parsedData: LocationPoint[] = data.map((item: any) => ({
          id: item.osm_id || `${item.lat}-${item.lon}-${Math.random().toString(36).slice(2, 7)}`,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          title: item.display_name,
        }))
        // 把候选点放到地图上供用户选择
        onSetLocations(parsedData)

        // 自动把地图移动到第一个结果附近，但不立即添加（用户自己选）
        const first = parsedData[0]
        onResult(first.lat, first.lng, first.title)
        // 不弹出选择 Modal —— 用户在地图上选择红点
      } else {
        notification.warning({ message: '未找到', description: '没有搜索到结果' })
      }
    } catch (err) {
      notification.error({ message: '查询失败', description: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return <Search placeholder="搜索地点或地址" enterButton={<SearchOutlined />} onSearch={doSearch} loading={loading} />
}

/* ---------------------------
   App (main)
   --------------------------- */
export default function App() {
  const { notification } = useNotification()

  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)

  const [mapCenter, setMapCenter] = useState<LatLngTuple>([35.8617, 104.1954])
  const [locations, setLocations] = useState<LocationPoint[]>([]) // 搜索候选点 (红点)
  const [measureMode, setMeasureMode] = useState(false)
  const [startMeasurePoint, setStartMeasurePoint] = useState<MeasurePoint | null>(null)
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([])
  const [currentPosition, setCurrentPosition] = useState<LatLngTuple | null>(null)

  const nextPointId = useRef(1)
  const nextTaskId = useRef(1)

  const [addToTaskModalVisible, setAddToTaskModalVisible] = useState(false)
  const addToTaskLatLng = useRef<{ lat: number; lng: number } | null>(null)

  // 保存待选的 location（点击红点时设置到这里，然后在 modal 里选任务）
  const pendingLocationToAdd = useRef<LocationPoint | null>(null)

  // Map ref: 使用 any 以避免 react-leaflet v4 的类型约束问题
  const mapRef = useRef<any>(null)

  /* --- realtime location watch --- */
  useEffect(() => {
    if (!navigator.geolocation) {
      notification.warning({ message: '定位不可用', description: '浏览器不支持定位' })
      return
    }
    const id = navigator.geolocation.watchPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCurrentPosition([lat, lng])
      },
      err => console.warn('定位失败', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  /* --- tasks operations --- */
  function addTask() {
    const name = window.prompt('请输入任务名称')
    if (!name) return
    const t: Task = { id: String(nextTaskId.current++), name, points: [], completed: false }
    setTasks(prev => [...prev, t])
    setCurrentTaskId(t.id)
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
    notification.success({ message: '任务完成', description: '该任务已标记为完成' })
  }

  function addPointToTask(taskId: string, lat: number, lng: number, distanceKm = 5) {
    const p: MeasurePoint = { id: String(nextPointId.current++), lat, lng, distanceKm }
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, points: [...t.points, p] } : t)))
    setSelectedPointId(p.id)
    notification.success({ message: '已添加点', description: `已加入任务 ${taskId}` })
  }

  function openAddToTaskModal(lat: number, lng: number) {
    addToTaskLatLng.current = { lat, lng }
    setAddToTaskModalVisible(true)
  }

  function handleAddToTaskModalOk(taskId: string | null) {
    if (!taskId || !addToTaskLatLng.current) {
      setAddToTaskModalVisible(false)
      return
    }
    addPointToTask(taskId, addToTaskLatLng.current.lat, addToTaskLatLng.current.lng)
    setAddToTaskModalVisible(false)
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

  function handleSearchResult(lat: number, lng: number, name?: string) {
    // 将地图飞到该位置（但不自动添加）
    if (mapRef.current) {
      try {
        // react-leaflet v4 把实例放在 mapRef.current whenRef? 但 ref on MapContainer works
        mapRef.current?.flyTo([lat, lng], mapRef.current.getZoom ? mapRef.current.getZoom() : 16)
      } catch (err) {
        // fallback: set center state
        setMapCenter([lat, lng])
      }
    } else {
      setMapCenter([lat, lng])
    }
    notification.success({ message: '定位成功', description: name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
  }

  // 将搜索得到的 locations 加到地图并自动 fitBounds
  useEffect(() => {
    if (!locations || locations.length === 0) return
    const latlngs = locations.map(l => [l.lat, l.lng] as [number, number])
    try {
      if (mapRef.current && latlngs.length) {
        const bounds = L.latLngBounds(latlngs)
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
      }
    } catch (err) {
      // ignore
    }
  }, [locations])

  const selectedTask = tasks.find(t => t.id === currentTaskId) || null
  const allPoints = selectedTask?.points || []

  /* 点击搜索结果红点：弹 popup（在 popup 中提供“添加到任务”） */
  function onClickSearchResult(loc: LocationPoint) {
    // center and open popup: react-leaflet popup opens on click anyway
    if (mapRef.current) {
      mapRef.current.flyTo([loc.lat, loc.lng], mapRef.current.getZoom ? mapRef.current.getZoom() : 16)
    }
  }

  /* 当用户从红点 popup 里点击“添加到任务” */
  function addLocationToTask(loc: LocationPoint) {
    // 如果当前选中有任务且未完成，则直接添加到当前任务
    if (currentTaskId) {
      const t = tasks.find(x => x.id === currentTaskId)
      if (t && !t.completed) {
        addPointToTask(currentTaskId, loc.lat, loc.lng)
        return
      }
    }

    // 否则弹出选择任务 modal，让用户选任务（与 “addToTaskModalVisible” 复用）
    pendingLocationToAdd.current = loc
    setAddToTaskModalVisible(true)
  }

  function handleAddToTaskSelected(taskId: string) {
    const loc = pendingLocationToAdd.current
    if (loc) {
      addPointToTask(taskId, loc.lat, loc.lng)
      pendingLocationToAdd.current = null
      setAddToTaskModalVisible(false)
      return
    }
    // fallback to basic add using addToTaskLatLng if set
    handleAddToTaskModalOk(taskId)
  }

  /* InputNumber 的键盘行为：只阻止箭头键冒泡到地图，不影响输入本身 */
  function stopMapZoomOnArrow(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
      e.stopPropagation()
    }
  }

  return (
    <Layout style={{ height: 'calc(100vh - 30px)' }}>
      <Sider width={340} style={{ background: '#fff', borderRight: '1px solid #eee', padding: 16 }}>
        {/* 左侧面板 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>
            任务面板
          </Title>
          <Space>
            <Tooltip title="添加任务">
              <Button icon={<PlusOutlined />} onClick={addTask} />
            </Tooltip>
            <Tooltip title="定位到当前位置">
              <Button
                icon={<AimOutlined />}
                onClick={() => {
                  if (!currentPosition)
                    return notification.warning({ message: '定位中', description: '正在获取当前位置...' })
                  if (mapRef.current && currentPosition) {
                    mapRef.current.flyTo(
                      [currentPosition[0], currentPosition[1]],
                      mapRef.current.getZoom ? mapRef.current.getZoom() : 16,
                    )
                  } else {
                    setMapCenter(currentPosition)
                  }
                  notification.success({ message: '已定位', description: '地图已移动到当前位置' })
                }}
              />
            </Tooltip>
            <Tooltip title="测距模式（点击两点）">
              <Button
                icon={<SwapOutlined />}
                onClick={() => {
                  setMeasureMode(m => !m)
                  setStartMeasurePoint(null)
                  notification.info({
                    message: '测距',
                    description: measureMode ? '已退出测距模式' : '已进入测距模式，点击地图选择起点',
                  })
                }}
                type={measureMode ? 'primary' : 'default'}
              />
            </Tooltip>
          </Space>
        </div>

        <div style={{ marginBottom: 12 }}>
          <GeocodeSearch onResult={handleSearchResult} onSetLocations={setLocations} />
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
              onClick={() =>
                selectedTask &&
                setTimeout(() => notification.info({ message: '自动缩放', description: '地图将缩放到任务点范围' }), 100)
              }
              style={{ marginLeft: 8 }}
              icon={<ShrinkOutlined />}
            >
              缩放到任务点
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

        {/* 任务列表 */}
        <div>
          <Title level={5}>任务列表</Title>
          <List
            bordered
            dataSource={tasks}
            renderItem={t => (
              <List.Item
                style={{ background: t.id === currentTaskId ? '#e6f7ff' : undefined, opacity: t.completed ? 0.6 : 1 }}
                actions={[
                  <Button size="small" onClick={() => setCurrentTaskId(t.id)}>
                    选择
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{t.name}</Text>
                      {t.completed && <Badge status="success" text="已完成" />}
                    </Space>
                  }
                  description={<Text type="secondary">点数: {t.points.length}</Text>}
                />
              </List.Item>
            )}
          />
        </div>

        {/* 点列表 + 可编辑半径 */}
        <div style={{ marginTop: 12 }}>
          <Title level={5}>点列表</Title>
          {!selectedTask && <Text type="secondary">请选择任务后查看点列表</Text>}
          {selectedTask && (
            <List
              size="small"
              bordered
              dataSource={selectedTask.points}
              renderItem={p => (
                <List.Item
                  style={{
                    background: p.id === selectedPointId ? '#fff1f0' : undefined,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={() => {
                    setSelectedPointId(p.id)
                    if (mapRef.current) {
                      mapRef.current.flyTo([p.lat, p.lng], mapRef.current.getZoom ? mapRef.current.getZoom() : 16)
                    }
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                  >
                    <div>
                      <Text strong>点 {p.id}</Text>
                      <div>
                        <Text type="secondary">
                          坐标: {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text>半径(km): </Text>
                      <InputNumber
                        min={0}
                        value={p.distanceKm}
                        onChange={value => {
                          if (value === null || value === undefined) return
                          setTasks(prev =>
                            prev.map(t =>
                              t.id === selectedTask.id
                                ? {
                                    ...t,
                                    points: t.points.map(pt =>
                                      pt.id === p.id ? { ...pt, distanceKm: Number(value) } : pt,
                                    ),
                                  }
                                : t,
                            ),
                          )
                        }}
                        onKeyDown={stopMapZoomOnArrow}
                        size="small"
                        style={{ width: 80 }}
                      />
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </Sider>

      {/* Main Map */}
      <Layout>
        <Content style={{ height: 'calc(100vh - 64px)' }}>
          <MapContainer
            center={mapCenter}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
            zoomControl={false}
            ref={mapRef}
          >
            <ZoomControl position="topright" />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler
              currentTaskId={currentTaskId}
              tasks={tasks}
              addPointToTask={addPointToTask}
              measureMode={measureMode}
              startMeasurePoint={startMeasurePoint}
              setStartMeasurePoint={setStartMeasurePoint}
              addLineSegment={addLineSegment}
              allowAddWhenNoTask={tasks.length > 0}
              openAddToTaskModal={openAddToTaskModal}
            />

            {/* realtime position marker */}
            {currentPosition && (
              <Marker position={currentPosition} icon={locatedIcon}>
                <Popup>
                  <div>
                    <div>
                      <strong>当前位置</strong>
                    </div>
                    <div>
                      坐标: {currentPosition[0].toFixed(6)}, {currentPosition[1].toFixed(6)}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Button
                        size="small"
                        onClick={() => {
                          if (!tasks.length) {
                            notification.warning({ message: '无任务', description: '请先创建任务' })
                            return
                          }
                          // 直接将当前位置添加到当前任务（如果存在）
                          const taskId = currentTaskId || tasks[0].id
                          addPointToTask(taskId, currentPosition[0], currentPosition[1])
                        }}
                      >
                        添加到任务
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* task points */}
            {allPoints.map(p => (
              <React.Fragment key={p.id}>
                <Marker position={[p.lat, p.lng]}>
                  <Popup>
                    <div>
                      <div>
                        <strong>点 {p.id}</strong>
                      </div>
                      <div>
                        坐标: {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                      </div>
                      <div>距离: {p.distanceKm} km</div>
                      <div style={{ marginTop: 8 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setMeasureMode(false)
                            setStartMeasurePoint(p)
                            notification.info({ message: '已选择起点', description: `起点：点 ${p.id}` })
                          }}
                        >
                          以此点为起点测距
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[p.lat, p.lng]}
                  radius={p.distanceKm * 1000}
                  pathOptions={{
                    color: p.id === selectedPointId ? 'red' : 'blue',
                    weight: p.id === selectedPointId ? 3 : 1,
                    fillOpacity: 0.06,
                  }}
                  renderer={L.canvas()}
                />
              </React.Fragment>
            ))}

            {/* line segments */}
            {lineSegments.map(ls => (
              <Polyline
                key={ls.id}
                positions={[
                  [ls.start.lat, ls.start.lng],
                  [ls.end.lat, ls.end.lng],
                ]}
                pathOptions={{ color: 'green', weight: 3 }}
              >
                <Popup>
                  <div>
                    <div>
                      <strong>线段</strong>
                    </div>
                    <div>
                      起点: ({ls.start.lat.toFixed(5)}, {ls.start.lng.toFixed(5)})
                    </div>
                    <div>
                      终点: ({ls.end.lat.toFixed(5)}, {ls.end.lng.toFixed(5)})
                    </div>
                    <div>距离: {ls.distanceKm.toFixed(3)} km</div>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* search result markers (red) clustered */}
            <MarkerClusterGroup>
              {locations.map(loc => (
                <Marker
                  key={loc.id}
                  position={[loc.lat, loc.lng]}
                  icon={searchMarkerIcon}
                  eventHandlers={{
                    click: () => onClickSearchResult(loc),
                  }}
                >
                  <Popup>
                    <div style={{ maxWidth: 320 }}>
                      <div style={{ fontWeight: 600 }}>{loc.title}</div>
                      <div style={{ marginTop: 8 }}>
                        <Space>
                          <Button
                            size="small"
                            onClick={() => {
                              // add to current task if exists and not completed, else open modal to choose
                              addLocationToTask(loc)
                            }}
                          >
                            添加到任务
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              if (mapRef.current) {
                                mapRef.current.flyTo(
                                  [loc.lat, loc.lng],
                                  mapRef.current.getZoom ? mapRef.current.getZoom() : 16,
                                )
                              }
                            }}
                          >
                            居中
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>

            <FitBounds points={allPoints} />
          </MapContainer>
        </Content>
      </Layout>

      {/* add-to-task modal (when clicking map or search popup without selecting a current task) */}
      <Modal
        title="选择要添加到的任务"
        open={addToTaskModalVisible}
        onCancel={() => {
          setAddToTaskModalVisible(false)
          pendingLocationToAdd.current = null
        }}
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
                  addTask()
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
              <List.Item
                onClick={() => {
                  // if we have a pending Location, add that; otherwise use addToTaskLatLng
                  if (pendingLocationToAdd.current) {
                    addPointToTask(t.id, pendingLocationToAdd.current.lat, pendingLocationToAdd.current.lng)
                    pendingLocationToAdd.current = null
                  } else if (addToTaskLatLng.current) {
                    addPointToTask(t.id, addToTaskLatLng.current.lat, addToTaskLatLng.current.lng)
                    addToTaskLatLng.current = null
                  }
                  setAddToTaskModalVisible(false)
                }}
                style={{ cursor: 'pointer' }}
              >
                {t.name}
              </List.Item>
            )}
          />
        )}
      </Modal>
    </Layout>
  )
}
