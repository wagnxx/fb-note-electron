import ParentEmpty from '@/components/layout/ParentEmpty'
import Dict from '@/pges/dict/Dict'
import WordAffix from '@/pges/dict/WordAffix'
import WordRoot from '@/pges/dict/WordRoot'

export const routesLearn = {
  path: '/learn',
  name: 'Dict',
  component: ParentEmpty,
  children: [
    {
      path: 'dict',
      name: 'dict',
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
  ],
}
