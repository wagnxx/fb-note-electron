import React, { forwardRef, useImperativeHandle } from 'react'
import { TabpanelRef } from './SidebarDir'
import { TabItem } from './MindMapCanvasContainer'

type Props = {
  getCanvasData: () => TabItem[] | undefined
  resetCanvasData: (data: TabItem[]) => void
}

const TabpanelCloud = forwardRef<TabpanelRef, Props>(({ getCanvasData, resetCanvasData }, ref) => {
  useImperativeHandle(ref, () => {
    return {
      saveNewFile: async (filename, data) => {
        return true
      },
      saveFile() {},
    }
  }, [])

  return <div>Recently downloaded files from the cloud</div>
})

export default TabpanelCloud
