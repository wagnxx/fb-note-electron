import { MeasurePoint } from '@/features/locator/types'
import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/* ---------------------------
   FitBounds (compute bounds from circle extents)
   --------------------------- */
export function FitBounds({ points }: { points: MeasurePoint[] }) {
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
