// src/features/locator/components/map/TaskMarkers.tsx
import React from 'react'
import { Marker, Popup, Circle, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { MeasurePoint, LineSegment } from '@/features/locator/types'

interface TaskMarkersProps {
  points: MeasurePoint[]
  selectedPointId: string | null
  lineSegments: LineSegment[]
  setStartMeasurePoint: (p: MeasurePoint | null) => void
  setSelectedPointId: (id: string) => void
  notification: any
}

export const TaskMarkers: React.FC<TaskMarkersProps> = ({
  points,
  selectedPointId,
  lineSegments,
  setStartMeasurePoint,
  setSelectedPointId,
  notification,
}) => {
  return (
    <>
      {points.map(p => (
        <React.Fragment key={p.id}>
          <Marker
            position={[p.lat, p.lng]}
            eventHandlers={{
              click: () => {
                setSelectedPointId(p.id)
                setStartMeasurePoint(p)
                notification.info({ message: '已选择起点', description: `起点：点 ${p.id}` })
              },
            }}
          >
            <Popup>
              <div>
                <strong>点 {p.id}</strong>
                <div>
                  坐标: {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                </div>
                <div>距离: {p.distanceKm} km</div>
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
              <strong>线段</strong>
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
    </>
  )
}
