import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import * as Tesseract from 'tesseract.js'
import { ensureDirectoryExists } from './fileManager'
const tessDataPath = path.join(__dirname, '../..', 'support', 'lang/tessdata')

/**
 * 比较两段文本，返回新增的部分
 * @param prevText 先前的文本
 * @param currText 当前的文本
 * @returns 返回新增的文本
 */
export function compareTexts(prevText: string, currText: string): string {
  const prevLines = prevText.split('\n')
  const currLines = currText.split('\n')

  let addedText = ''
  currLines.forEach(line => {
    if (!prevLines.includes(line)) {
      addedText += line + '\n'
    }
  })

  return addedText
}

/**
 * 使用 Tesseract.js 从图像中提取文本
 * @param imagePath 图像文件路径
 * @returns 返回提取的文本
 */
export function extractTextFromImage(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(
      imagePath,
      // 'eng+chi_sim+chi_tra',
      'eng+chi_sim',
      {
        langPath: tessDataPath,
        logger: m => console.log(m),
      },
    )
      .then(({ data: { text } }) => resolve(text))
      .catch(error => reject(`Error extracting text from ${imagePath}: ${error}`))
  })
}

// 提取视频帧
export const extractFrameAtTime = async (videoPath: string, timestampInSeconds: number, outputImagePath: string) => {
  await ensureDirectoryExists(path.dirname(outputImagePath))
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestampInSeconds], // 指定提取的时间戳（秒）
        filename: path.basename(outputImagePath), // 输出帧的文件名
        folder: path.dirname(outputImagePath), // 输出文件夹
        // size: '640x?',  // 可选：设置提取图像的尺寸
      })
      .on('end', () => {
        resolve(outputImagePath)
      })
      .on('error', (err: Error) => {
        reject(err)
      })
  })
}
