// src/features/locator/components/map/LocationMarkers.tsx
import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import { LocationPoint } from '@/features/locator/types'
import { searchMarkerIcon } from '@/features/locator/constants'
import { Button, Space } from 'antd'

interface LocationMarkersProps {
  locations: LocationPoint[]
  onAddToTask: (loc: LocationPoint) => void
  mapRef?: any
}

export const LocationMarkers: React.FC<LocationMarkersProps> = ({ locations, onAddToTask, mapRef }) => {
  const handleFlyTo = (loc: LocationPoint) => {
    if (mapRef?.current) {
      mapRef.current.flyTo([loc.lat, loc.lng], mapRef.current.getZoom ? mapRef.current.getZoom() : 16)
    }
  }

  return (
    <>
      {locations.map(loc => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={searchMarkerIcon}>
          <Popup>
            <div style={{ maxWidth: 320 }}>
              <div style={{ fontWeight: 600 }}>{loc.title}</div>
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Button size="small" onClick={() => onAddToTask(loc)}>
                    添加到任务
                  </Button>
                  <Button size="small" onClick={() => handleFlyTo(loc)}>
                    居中
                  </Button>
                </Space>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
