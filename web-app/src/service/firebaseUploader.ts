import { fbStorage } from '@/firebase/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

/**
 * 上传文件到 Firebase 并返回下载 URL
 * @param fileBuffer - 文件的 Buffer 数据
 * @param path - 存储路径 (e.g., 'uploads/myFile')
 * @returns {Promise<string>} - 返回文件的下载地址
 */
export const uploadFileToFirebase = async (
  fileBuffer: ArrayBuffer,
  path: string,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  try {
    // 创建存储引用
    const storageRef = ref(fbStorage, path)

    // 上传文件
    const uploadTask = uploadBytesResumable(storageRef, fileBuffer)

    // 等待上传完成
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        snapshot => {
          // 计算上传进度
          const progress = snapshot.bytesTransferred / snapshot.totalBytes
          // 调用回调函数，传递进度
          onProgress?.(progress)
        },
        error => {
          console.error('Upload failed:', error)
          reject(error)
        },
        () => resolve(),
      )
    })

    // 获取文件的下载 URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}
