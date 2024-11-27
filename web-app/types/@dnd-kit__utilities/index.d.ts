declare module '@dnd-kit/utilities' {
  export const CSS: {
    Translate: (transform: { x: number; y: number }) => string
    Scale: (scale: { x: number; y: number }) => string
    Transform: (transform: { x: number; y: number; scale: number }) => string
  }
}
