import ParentEmpty from '@/components/layout/ParentEmpty'
import MindMapManagePage from '@/pages/mindmap/MindMapManagePage'
import MultiDocSnap from '@/pages/tools/docSnap/MultiDocSnap'
import CinemaMoments from '@/pages/tools/video/CinemaMoments'
import VideoDownloader from '@/pages/tools/video/components/VideoDownloader'
import ScreenshotDoc from '@/pages/tools/docSnap/ScreenshotDoc'
import { RouteConfig } from '../routes'

export const routesTool: RouteConfig = {
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
      name: 'Video',
      component: ParentEmpty,
      children: [
        {
          path: 'cinemaMoments',
          name: 'Video Player',
          component: CinemaMoments,
        },
        {
          path: 'VideoDownloader',
          name: 'Video Downloader',
          component: VideoDownloader,
          isDesktop: true,
          hidden: true,
        },
      ],
    },
    {
      path: 'docSnap',
      name: 'Doc Snap',
      component: ParentEmpty,
      children: [
        {
          path: 'manage',
          name: 'manage',
          component: ScreenshotDoc,
        },
        {
          path: 'multi',
          name: 'multi Doc',
          component: MultiDocSnap,
        },
      ],
    },
  ],
}
