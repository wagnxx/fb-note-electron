// src/utils/fingerprint.ts

export interface FingerprintComponents {
  userAgent: string
  screen: string
  language: string
  timezoneOffset: number
  webglSupport: boolean
  canvasFingerprint: string
}

export function generateFingerprint(): string {
  const components: FingerprintComponents = {
    userAgent: navigator.userAgent,
    screen: `${screen.height}x${screen.width}x${screen.colorDepth}`,
    language: navigator.language,
    timezoneOffset: new Date().getTimezoneOffset(),
    webglSupport: hasWebGLSupport(),
    canvasFingerprint: getCanvasFingerprint(),
  }

  const rawString = Object.values(components).join('||')
  return hashString(rawString)
}

function hashString(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString()
}

function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function getCanvasFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillStyle = '#f60'
  ctx.fillRect(0, 0, 100, 30)
  ctx.fillStyle = '#069'
  ctx.fillText('Hello, world!', 2, 2)
  return canvas.toDataURL()
}
