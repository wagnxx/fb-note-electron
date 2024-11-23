import ParentEmpty from '@/components/layout/ParentEmpty'
import MindMapManagePage from '@/pges/mindmap/MindMapManagePage'
import CinemaMoments from '@/pges/tools/video/CinemaMoments'
import VideoDownloader from '@/pges/tools/video/components/VideoDownloader'
import ScreenshotDoc from '@/pges/tools/video/ScreenshotDoc'

export const routesTool = {
  path: '/tool',
  name: 'Tool',
  component: ParentEmpty,
  children: [
    {
      path: 'mindmapManage',
      name: 'Mind',
      component: MindMapManagePage,
    },
    {
      path: 'video',
      name: 'video',
      component: ParentEmpty,
      children: [
        {
          path: 'cinemaMoments',
          name: 'CinemaMoments',
          component: CinemaMoments,
        },
        {
          path: 'VideoDownloader',
          name: 'VideoDownloader',
          component: VideoDownloader,
        },
        {
          path: 'ScreenshotDoc',
          name: 'ScreenshotDoc',
          component: ScreenshotDoc,
        },
      ],
    },
  ],
}
