import { ipcMain } from 'electron'
import { IPC_ACTIONS } from '@/constants'
import { generateMacIcons, generateWinIcons } from '@/utils/imageUtils'
import { GenerateResult, IconOptions } from '@shared/types'

type IpcIconOptions = Omit<IconOptions, 'input' | 'outputDir'> & {
  type: 'mac' | 'win'
  enInput: string
  enOutputDir: string
}

export const imageHandler = () => {
  ipcMain.handle(
    IPC_ACTIONS.IMAGE_TO_ICONS,
    async (
      event,
      { type, enInput, enOutputDir, rounded = true, radius = 40 }: IpcIconOptions,
    ): Promise<GenerateResult> => {
      const input = decodeURIComponent(enInput)
      const outputDir = decodeURIComponent(enOutputDir)

      if (!type || !input || !outputDir)
        return {
          ok: false,
          data: [],
          message: 'type enInput, enOutputDir is missed',
        }
      const params = {
        input,
        outputDir,
        rounded,
        radius,
      }

      if (type === 'mac') {
        return generateMacIcons(params)
      } else {
        return generateWinIcons(params)
      }
    },
  )
}
