// src/features/locator/components/map/RealtimeMarker.tsx
import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import { LatLngTuple } from 'leaflet'
import { locatedIcon } from '@/features/locator/constants'
import { Button } from 'antd'

interface RealtimeMarkerProps {
  position: LatLngTuple | null
  tasks: { id: string; name: string }[]
  currentTaskId: string | null
  addPointToTask: (taskId: string, lat: number, lng: number) => void
  notification: any
}

export const RealtimeMarker: React.FC<RealtimeMarkerProps> = ({
  position,
  tasks,
  currentTaskId,
  addPointToTask,
  notification,
}) => {
  if (!position) return null

  const handleAddToTask = () => {
    if (!tasks.length) {
      notification.warning({ message: '无任务', description: '请先创建任务' })
      return
    }
    const taskId = currentTaskId || tasks[0].id
    addPointToTask(taskId, position[0], position[1])
  }

  return (
    <Marker position={position} icon={locatedIcon}>
      <Popup>
        <div>
          <div>
            <strong>当前位置</strong>
          </div>
          <div>
            坐标: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </div>
          <div style={{ marginTop: 8 }}>
            <Button size="small" onClick={handleAddToTask}>
              添加到任务
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
