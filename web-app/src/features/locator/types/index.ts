/* ---------------------------
   Types
   --------------------------- */
export enum TaskType {
  Circle = 'circle',
  Measure = 'measure',
  Marker = 'marker',
}
export type MeasurePoint = {
  id: string
  lat: number
  lng: number
  distanceKm: number
  name?: string
}

export type Task = {
  id: string
  name: string
  type: TaskType
  points: MeasurePoint[]
  completed: boolean
}

export type LineSegment = {
  id: string
  start: MeasurePoint
  end: MeasurePoint
  distanceKm: number
}

export interface LocationPoint {
  id: string | number
  lat: number
  lng: number
  title?: string
}
