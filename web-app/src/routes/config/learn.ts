import ParentEmpty from '@/components/layout/ParentEmpty'
import Dict from '@/pages/dict/Dict'
import Sentences from '@/pages/dict/Sentences'
import WordAffix from '@/pages/dict/WordAffix'
import WordRoot from '@/pages/dict/WordRoot'
import { RouteConfig } from '../routes'

export const routesLearn: RouteConfig = {
  path: '/learn',
  name: 'Dict',
  component: ParentEmpty,
  requiresAuth: true,
  children: [
    {
      path: 'dict',
      name: 'dict',
      isDesktop: true,
      component: Dict,
    },
    {
      path: 'word-root',
      name: 'WordRoot',
      component: WordRoot,
    },
    {
      path: 'word-affix',
      name: 'WordAffix',
      component: WordAffix,
    },
    {
      path: 'word-sentences',
      name: 'Sentences',
      component: Sentences,
    },
  ],
}
