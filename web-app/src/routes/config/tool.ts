import ParentEmpty from '@/components/layout/ParentEmpty'
import MindMapManagePage from '@/pages/mindmap'
import MultiDocSnap from '@/pages/tools/docSnap/MultiDocSnap'
import CinemaMoments from '@/pages/tools/video/CinemaMoments'
import VideoDownloader from '@/pages/tools/video/components/VideoDownloader'
import ScreenshotDoc from '@/pages/tools/docSnap/ScreenshotDoc'
import { RouteConfig } from '../routes'
import DocToImageConverter from '@/pages/tools/docSnap/DocToImageConverter'
import MindMap from '@/pages/mindmap/MindMap'
import IconGenerator from '@/pages/tools/image/IconGenerator'
import Books from '@/pages/tools/books'
import ChatRoom from '@/pages/tools/chat/ChatRoom'

export const routesTool: RouteConfig = {
  path: '/tool',
  name: 'Tool',
  component: ParentEmpty,
  children: [
    {
      path: 'mindmap',
      name: 'Mind',
      component: MindMapManagePage,
      children: [
        {
          path: 'make',
          name: 'MindMapMake',
          component: MindMap,
        },
      ],
    },
    {
      path: 'video',
      name: 'Video',
      component: ParentEmpty,
      requiresAuth: false,
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
      requiresAuth: true,
      children: [
        {
          path: 'manage',
          name: 'Doc List',
          component: ScreenshotDoc,
        },
        {
          path: 'multi',
          name: 'Multi-Doc Uploader',
          component: MultiDocSnap,
        },
        {
          path: 'docConverter',
          name: 'Doc Converter',
          component: DocToImageConverter,
        },
      ],
    },
    {
      path: 'image',
      name: 'Image',
      component: IconGenerator,
      requiresAuth: false,
    },
    {
      path: 'books',
      name: 'Books',
      component: Books,
      requiresAuth: false,
    },
    {
      path: 'chat',
      name: 'ChatRoom',
      component: ChatRoom,
      requiresAuth: false,
    },
  ],
}
