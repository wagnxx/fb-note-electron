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
import L, { LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow })

// --- Types ---
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

// --- Utilities ---
function distanceKm(p1: MeasurePoint, p2: MeasurePoint) {
  const R = 6371
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// --- Map Click Handler ---
function MapClickHandler({
  currentTaskId,
  tasks,
  addPointToTask,
  measureMode,
  startMeasurePoint,
  setStartMeasurePoint,
  addLineSegment,
}: {
  currentTaskId: string | null
  tasks: Task[]
  addPointToTask: (taskId: string, lat: number, lng: number) => void
  measureMode: boolean
  startMeasurePoint: MeasurePoint | null
  setStartMeasurePoint: (p: MeasurePoint | null) => void
  addLineSegment: (start: MeasurePoint, end: MeasurePoint) => void
}) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng

      if (measureMode) {
        if (!startMeasurePoint) {
          const tempPoint: MeasurePoint = { id: 'tmp', lat, lng, distanceKm: 0 }
          setStartMeasurePoint(tempPoint)
          alert('已选择起点，请选择终点')
        } else {
          const tempPoint: MeasurePoint = { id: 'tmp2', lat, lng, distanceKm: 0 }
          addLineSegment(startMeasurePoint, tempPoint)
          setStartMeasurePoint(null)
        }
        return
      }

      if (!currentTaskId) {
        alert('请先选择任务才能添加点')
        return
      }
      const task = tasks.find(t => t.id === currentTaskId)
      if (task && task.completed) {
        alert('该任务已完成，不能添加点')
        return
      }
      const choice = prompt('选择操作: 1-添加测量点 2-画圈')
      if (choice === '1') {
        addPointToTask(currentTaskId, lat, lng)
      } else if (choice === '2') {
        addPointToTask(currentTaskId, lat, lng)
      }
    },
  })
  return null
}

// --- Fit Bounds ---
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

// --- Main App ---
export default function AdvancedTaskMapApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([35.8617, 104.1954])
  const [measureMode, setMeasureMode] = useState(false)
  const [startMeasurePoint, setStartMeasurePoint] = useState<MeasurePoint | null>(null)
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([])
  const nextPointId = useRef(1)
  const nextTaskId = useRef(1)

  const addPointToTask = (taskId: string, lat: number, lng: number, distanceKm = 5) => {
    const point: MeasurePoint = { id: String(nextPointId.current++), lat, lng, distanceKm }
    setTasks(ts => ts.map(t => (t.id === taskId ? { ...t, points: [...t.points, point] } : t)))
    setSelectedPointId(point.id)
  }

  const addTask = () => {
    const name = prompt('请输入任务名称')
    if (!name) return
    const task: Task = { id: String(nextTaskId.current++), name, points: [], completed: false }
    setTasks(ts => [...ts, task])
  }

  const completeTask = (taskId: string) => {
    setTasks(ts => ts.map(t => (t.id === taskId ? { ...t, completed: true } : t)))
  }

  const addLineSegment = (start: MeasurePoint, end: MeasurePoint) => {
    const dist = distanceKm(start, end)
    const segment: LineSegment = { id: `${start.id}-${end.id}`, start, end, distanceKm: dist }
    setLineSegments(ls => [...ls, segment])
    alert(
      `线段距离: ${dist.toFixed(2)} km\n起点: (${start.lat.toFixed(5)}, ${start.lng.toFixed(5)})\n终点: (${end.lat.toFixed(5)}, ${end.lng.toFixed(5)})`,
    )
  }

  const locateCurrentPosition = async () => {
    if (!navigator.geolocation) return alert('浏览器不支持定位')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setMapCenter([lat, lng])
      },
      err => alert('定位失败: ' + err.message),
    )
  }

  const selectedTask = tasks.find(t => t.id === currentTaskId)
  const allPoints = selectedTask?.points || []

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: 300, padding: 10, borderRight: '1px solid #ccc', overflowY: 'auto', background: '#f9f9f9' }}>
        <div style={{ marginBottom: 10 }}>
          <button onClick={addTask} style={{ marginRight: 5 }}>
            添加任务
          </button>
          <button onClick={locateCurrentPosition} style={{ marginRight: 5 }}>
            定位当前位置
          </button>
          {currentTaskId && !selectedTask?.completed && (
            <button onClick={() => completeTask(currentTaskId)}>标记完成</button>
          )}
          <button onClick={() => setMeasureMode(!measureMode)} style={{ marginLeft: 5 }}>
            {measureMode ? '结束测量' : '测量两点距离'}
          </button>
        </div>
        <h3>任务列表</h3>
        <ul>
          {tasks.map(t => (
            <li
              key={t.id}
              style={{
                cursor: 'pointer',
                fontWeight: t.id === currentTaskId ? 'bold' : 'normal',
                color: t.completed ? '#999' : '#000',
              }}
              onClick={() => setCurrentTaskId(t.id)}
            >
              {t.name}
            </li>
          ))}
        </ul>
        {selectedTask && (
          <div>
            <h4>{selectedTask.name} 点列表</h4>
            <ul>
              {selectedTask.points.map(p => (
                <li
                  key={p.id}
                  style={{ cursor: 'pointer', color: p.id === selectedPointId ? 'red' : 'black' }}
                  onClick={() => setSelectedPointId(p.id)}
                >
                  点 {p.id} - 距离:{' '}
                  <input
                    type="number"
                    value={p.distanceKm}
                    onChange={e => {
                      const newVal = Number(e.target.value)
                      setTasks(ts =>
                        ts.map(t =>
                          t.id === currentTaskId
                            ? {
                                ...t,
                                points: t.points.map(pt => (pt.id === p.id ? { ...pt, distanceKm: newVal } : pt)),
                              }
                            : t,
                        ),
                      )
                    }}
                    style={{ width: 50 }}
                  />{' '}
                  km
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer
          key={`${mapCenter[0]}-${mapCenter[1]}`}
          center={mapCenter}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl={false}
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
          />
          {allPoints.map(p => (
            <React.Fragment key={p.id}>
              <Marker position={[p.lat, p.lng]} draggable>
                <Popup>
                  点 {p.id} 详细信息
                  <br />
                  距离:{' '}
                  <input
                    type="number"
                    value={p.distanceKm}
                    onChange={e => {
                      const newVal = Number(e.target.value)
                      setTasks(ts =>
                        ts.map(t =>
                          t.id === currentTaskId
                            ? {
                                ...t,
                                points: t.points.map(pt => (pt.id === p.id ? { ...pt, distanceKm: newVal } : pt)),
                              }
                            : t,
                        ),
                      )
                    }}
                    style={{ width: 60 }}
                  />{' '}
                  km
                </Popup>
              </Marker>
              <Circle
                center={[p.lat, p.lng]}
                radius={p.distanceKm * 1000}
                pathOptions={{
                  color: p.id === selectedPointId ? 'red' : 'blue',
                  weight: p.id === selectedPointId ? 3 : 1,
                  fillOpacity: 0.1,
                }}
                renderer={L.canvas()}
              />
            </React.Fragment>
          ))}
          {lineSegments.map(ls => (
            <Polyline
              key={ls.id}
              positions={[
                [ls.start.lat, ls.start.lng],
                [ls.end.lat, ls.end.lng],
              ]}
              pathOptions={{ color: 'green', weight: 3 }}
            >
              <Popup>线段距离: {ls.distanceKm.toFixed(2)} km</Popup>
            </Polyline>
          ))}
          <FitBounds points={allPoints} />
        </MapContainer>
      </div>
    </div>
  )
}
