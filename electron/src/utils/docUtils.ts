import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
import { promisify } from 'util';

// 使用 promisify 将 exec 包装成支持 Promise 的形式
const execPromise = promisify(exec);

// 转换 doc 文件为图片的方法
export async function convertDocToImage(file: string | ArrayBuffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let tempFilePath: string;
    let outputFilePath: string;

    // 处理 file 为 ArrayBuffer 类型的情况
    if (file instanceof ArrayBuffer) {
      // 如果传入的是 ArrayBuffer，先保存为临时的 .docx 文件
      tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.docx`);
      fs.writeFileSync(tempFilePath, Buffer.from(file)); // 将 ArrayBuffer 写入临时文件
    } else {
      // 如果传入的是 string 类型的文件路径，直接使用
      tempFilePath = decodeURIComponent(file) 
    }

    // 设置输出文件路径
    outputFilePath = tempFilePath.replace('.docx', '.png'); // 默认生成 .png 图片

    // 使用 LibreOffice 转换 DOCX 为 PNG（也可以使用其他工具，如 unoconv）
    execPromise(`soffice --headless --convert-to png  ${tempFilePath}  --outdir ${path.dirname(tempFilePath)}`)
      .then(() => {
        // 转换成功，读取生成的图片文件
        const imageBuffer = fs.readFileSync(outputFilePath);


        if (typeof file !== 'string') {
            fs.unlinkSync(tempFilePath);
            fs.unlinkSync(outputFilePath);
        }

        // 返回图片 Buffer 数据
        resolve(imageBuffer);
      })
      .catch((error) => {
        // 如果出错，删除临时文件并返回错误
        if (fs.existsSync(tempFilePath) && typeof file !== 'string') fs.unlinkSync(tempFilePath); // 删除临时 DOCX 文件
        if (fs.existsSync(outputFilePath) && typeof file !== 'string') fs.unlinkSync(outputFilePath); // 删除临时 PNG 文件
        reject(new Error(`Conversion failed: ${error.message}`));
      });
  });
}
