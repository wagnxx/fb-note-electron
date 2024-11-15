import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ensureDirectoryExists, renameAndOverwrite } from './fileManager';

/**
 * 单张图片裁剪并保存为文件
 * @param filePath 图片路径
 * @param cropRange 裁剪区域 { left, top, width, height }
 * @param outputPath 输出路径
 */
export const cropImageToFile = async (filePath: string, cropRange: { left: number, top: number, width: number, height: number }, outputPath: string): Promise<void> => {
    try {
        console.log(`Start cropping image: ${filePath}`);

        // 确保输出文件名不与输入文件相同
        const tempOutputPath = filePath.replace(/(\.[\w\d_-]+)$/i, '-temp$1');  // 生成一个临时文件名

        // 使用 sharp 进行裁剪
        await sharp(filePath)
            .extract(cropRange)
            .toFile(tempOutputPath);
        console.log(`Image cropped and saved to: ${tempOutputPath}`);

        // 替换原文件为裁剪后的文件
        await renameAndOverwrite(tempOutputPath, filePath);
        console.log(`Original image replaced with cropped image: ${filePath}`);
    } catch (err) {
        console.error(`Error cropping image ${filePath}: ${(err as Error).message}`);
        throw new Error(`Failed to crop image: ${filePath}`);
    }
};

/**
 * 批量裁剪图片
 * @param filePaths 图片路径数组
 * @param cropRange 裁剪区域 { left, top, width, height }
 */
export const batchCropImages = async (filePaths: string[], cropRange: { left: number, top: number, width: number, height: number }): Promise<{ ok: boolean, message?: string }> => {
    try {
        // 确保输出目录存在


        // 批量裁剪图片，使用 Promise.all 并行处理
        const cropPromises = filePaths.map((filePath) => {
            const outputPath = filePath;  // 输出文件路径与原文件名一致

            return cropImageToFile(filePath, cropRange, outputPath);  // 调用 cropImageToFile 方法处理每个文件
        });

        // 等待所有裁剪操作完成
        await Promise.all(cropPromises);

        console.log('All images have been cropped successfully.');
        return {
            ok: true,
        }
    } catch (err) {
        console.error('Error during batch image cropping:', (err as Error).message);
        // throw new Error('Batch image cropping failed');
        return {
            ok: false,
            message: 'Error during batch image cropping:' + (err as Error).message
        }
    }
};

/**
 * 合并图片（横向或垂直布局）
 * @param {string} folder - 存储合并后图片的目标文件夹
 * @param {'row' | 'col'} layout - 布局方式，'row' 或 'col'
 * @param {Array<{path: string, width: number, height: number}>} images - 图片数组，每张图片的路径、宽度、高度
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
export const mergeImages = async ({ folder, layout, images, mergedName }: { folder: string, layout: 'col' | 'row', images: Array<{ path: string, width: number, height: number }>, mergedName: string }): Promise<{ ok: boolean, message?: string }> => {
    try {
        // 确保目标文件夹存在
        await ensureDirectoryExists(folder);

        // 计算合并后的尺寸
        let totalWidth = 0;
        let totalHeight = 0;
        const imageBuffers = [];

        // 根据布局来计算合并尺寸
        if (layout === 'row') {
            // 横向合并：宽度相加，高度取最大
            totalHeight = Math.max(...images.map(image => image.height));
            totalWidth = images.reduce((acc, image) => acc + image.width, 0);
        } else if (layout === 'col') {
            // 垂直合并：高度相加，宽度取最大
            totalWidth = Math.max(...images.map(image => image.width));
            totalHeight = images.reduce((acc, image) => acc + image.height, 0);
        }

        // 读取每个图片并添加到图片缓冲区
        let xOffset = 0;
        let yOffset = 0;
        const compositeImages = [];

        for (const image of images) {
            const buffer = await sharp(image.path)
                .resize(image.width, image.height) // 确保图片的尺寸和传入的宽高一致
                .toBuffer();

            // 根据布局设置合成的位置
            if (layout === 'row') {
                compositeImages.push({ input: buffer, left: xOffset, top: 0 });
                xOffset += image.width; // 横向排列时增加水平偏移量
            } else if (layout === 'col') {
                compositeImages.push({ input: buffer, left: 0, top: yOffset });
                yOffset += image.height; // 垂直排列时增加垂直偏移量
            }
        }

        // 合并图片
        const finalImage = sharp({
            create: {
                width: totalWidth,
                height: totalHeight,
                channels: 3, // 使用 RGB 通道
                background: { r: 255, g: 255, b: 255 } // 设置背景为白色
            }
        }).composite(compositeImages);

        // 最终保存合并后的图片
        const outputFilePath = path.join(folder, mergedName);
        await finalImage.toFile(outputFilePath);

        // 返回成功结果
        return { ok: true };
    } catch (err) {
        console.error('Error merging images:', err);
        // 返回失败结果
        return { ok: false, message: err instanceof Error ? err.message : 'Unknown error' };
    }
};

