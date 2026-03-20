import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { WritingType } from '@shared/types/writing'
import ArticleView from './components/ArticleView'
import NovelView from './components/NovelView'

const WritingView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') as WritingType) || 'article'

  if (type === 'novel') {
    return <NovelView />
  }

  // article / short_story / video_script 都是单篇内容
  return <ArticleView />
}

export default WritingView
