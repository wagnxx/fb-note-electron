export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result) // base64 string
      } else {
        reject(new Error('Failed to read file as base64 string'))
      }
    }

    reader.onerror = error => {
      reject(error)
    }

    reader.readAsDataURL(file)
  })
}
