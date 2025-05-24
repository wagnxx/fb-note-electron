import path from 'path'

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1)
  switch (ext) {
    case 'js':
      return 'application/javascript'
    case 'css':
      return 'text/css'
    case 'html':
      return 'text/html'
    case 'json':
      return 'application/json'
    case 'svg':
      return 'image/svg+xml'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'gz':
      return 'application/gzip'
    default:
      return 'application/octet-stream'
  }
}
