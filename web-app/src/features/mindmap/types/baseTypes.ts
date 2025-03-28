export type ID = string
import React from 'react'

export interface Position {
  x: number
  y: number
}

export type TopicTheme = {
  key: string | number
  name: string
  label: string
  style: React.CSSProperties
}
