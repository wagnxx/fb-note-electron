import ParentEmpty from '@/components/layout/ParentEmpty'
import MindMapManagePage from '@/pges/mindmap/MindMapManagePage'
import MultiDocSnap from '@/pges/tools/docSnap/MultiDocSnap'
import CinemaMoments from '@/pges/tools/video/CinemaMoments'
import VideoDownloader from '@/pges/tools/video/components/VideoDownloader'
import ScreenshotDoc from '@/pges/tools/docSnap/ScreenshotDoc'

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
